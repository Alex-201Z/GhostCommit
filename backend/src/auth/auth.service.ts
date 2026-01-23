import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateOrCreateGithubUser(profile: any) {
    let user = await this.prisma.user.findUnique({
      where: { githubId: profile.githubId },
    });

    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: profile.githubId,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
          },
        });
      }
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          githubId: profile.githubId,
          username: profile.username,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
    }

    // Update last active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return user;
  }

  async validateOrCreateGitlabUser(profile: any) {
    let user = await this.prisma.user.findUnique({
      where: { gitlabId: profile.gitlabId },
    });

    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            gitlabId: profile.gitlabId,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
          },
        });
      }
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          gitlabId: profile.gitlabId,
          username: profile.username,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
    }

    // Update last active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return user;
  }

  async generateToken(user: any) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
