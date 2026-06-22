import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GithubOAuthClient, GithubProfile } from './github-oauth.client';

const STATE_TTL_MS = 10 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly github: GithubOAuthClient,
    private readonly config: ConfigService,
  ) {}

  async startGithub() {
    const state = randomBytes(32).toString('base64url');
    await this.prisma.oAuthState.create({
      data: { stateHash: this.hash(state), expiresAt: new Date(Date.now() + STATE_TTL_MS) },
    });
    return { authorizationUrl: this.github.authorizationUrl(state) };
  }

  async finishGithub(code: string, state: string) {
    const stateHash = this.hash(state);
    const claimed = await this.prisma.oAuthState.updateMany({
      where: { stateHash, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });
    if (claimed.count !== 1) throw new UnauthorizedException('Invalid or expired OAuth state');
    const profile = await this.github.exchange(code);
    const user = await this.upsertGithubUser(profile);
    const session = await this.issueSession(user.id);
    return { user: this.publicUser(user), refreshToken: session.refreshToken };
  }

  async refresh(rawToken: string) {
    if (!rawToken) throw new UnauthorizedException('Authentication required');
    const tokenHash = this.hash(rawToken);
    const current = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!current || current.expiresAt <= new Date())
      throw new UnauthorizedException('Invalid session');
    if (current.revokedAt) {
      await this.prisma.authSession.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid session');
    }
    const replacementToken = randomBytes(48).toString('base64url');
    const replacementHash = this.hash(replacementToken);
    const replacement = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.authSession.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (claimed.count !== 1) throw new UnauthorizedException('Invalid session');
      const created = await tx.authSession.create({
        data: {
          userId: current.userId,
          tokenHash: replacementHash,
          familyId: current.familyId,
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        },
      });
      await tx.authSession.update({
        where: { id: current.id },
        data: { replacedById: created.id },
      });
      return created;
    });
    return {
      accessToken: this.accessToken(current.user),
      refreshToken: replacementToken,
      expiresAt: replacement.expiresAt,
      user: this.publicUser(current.user),
    };
  }

  async logout(rawToken?: string) {
    if (rawToken)
      await this.prisma.authSession.updateMany({
        where: { tokenHash: this.hash(rawToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }

  private async issueSession(userId: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash: this.hash(refreshToken),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });
    return { refreshToken };
  }

  private async upsertGithubUser(profile: GithubProfile) {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { githubId: profile.githubId } });
      if (!user) user = await tx.user.findUnique({ where: { email: profile.email } });
      user = user
        ? await tx.user.update({
            where: { id: user.id },
            data: {
              githubId: profile.githubId,
              email: profile.email,
              username: profile.username,
              name: profile.name,
              avatarUrl: profile.avatarUrl,
              lastActiveAt: new Date(),
            },
          })
        : await tx.user.create({
            data: {
              githubId: profile.githubId,
              email: profile.email,
              username: profile.username,
              name: profile.name,
              avatarUrl: profile.avatarUrl,
              lastActiveAt: new Date(),
            },
          });
      await tx.team.upsert({
        where: { personalOwnerId: user.id },
        update: {},
        create: {
          personalOwnerId: user.id,
          name: `${user.name || user.username || 'Developer'} workspace`,
          slug: `personal-${user.id}`,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });
      await tx.onboardingStatus.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      return user;
    });
  }

  private accessToken(user: { id: string; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }
  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  private publicUser(user: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
    };
  }
  get successRedirect() {
    return (
      this.config.get<string>('DASHBOARD_AUTH_SUCCESS_URL') ||
      `${this.config.get<string>('DASHBOARD_URL') || 'http://localhost:5173'}/auth/callback`
    );
  }
}
