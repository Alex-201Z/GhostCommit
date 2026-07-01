import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AgentLinkConfirmDto, AgentLinkRequestDto } from './dto/agent-link.dto';

const LINK_TTL_MINUTES = 10;
const TOKEN_TTL_DAYS = 90;

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function createLinkCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[randomInt(alphabet.length)];
  }
  return `GC-${suffix}`;
}

function publicInstallation(installation: {
  id: string;
  deviceLabel: string;
  osFamily: string | null;
  agentVersion: string | null;
  status: string;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: installation.id,
    deviceLabel: installation.deviceLabel,
    osFamily: installation.osFamily,
    agentVersion: installation.agentVersion,
    status: installation.status,
    lastSeenAt: installation.lastSeenAt,
    revokedAt: installation.revokedAt,
    createdAt: installation.createdAt,
    updatedAt: installation.updatedAt,
  };
}

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async createLinkRequest(userId: string, dto: AgentLinkRequestDto) {
    const linkCode = createLinkCode();
    const expiresAt = new Date(Date.now() + LINK_TTL_MINUTES * 60 * 1000);

    await this.prisma.agentLinkRequest.create({
      data: {
        userId,
        codeHash: sha256(linkCode),
        deviceLabel: dto.deviceLabel,
        osFamily: dto.osFamily,
        agentVersion: dto.agentVersion,
        expiresAt,
      },
    });

    return {
      linkCode,
      deepLink: `ghostcommit://agent/link?code=${encodeURIComponent(linkCode)}`,
      expiresAt,
    };
  }

  async confirmLink(userId: string, dto: AgentLinkConfirmDto) {
    const request = await this.prisma.agentLinkRequest.findUnique({
      where: { codeHash: sha256(dto.linkCode) },
    });

    if (!request || request.userId !== userId || request.expiresAt <= new Date()) {
      throw new NotFoundException('Agent link request not found or expired');
    }
    if (request.consumedAt) {
      throw new ConflictException('Agent link request already consumed');
    }

    const agentToken = `gca_${randomBytes(32).toString('base64url')}`;
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    const installation = await this.prisma.$transaction(async (tx) => {
      await tx.agentLinkRequest.update({
        where: { id: request.id },
        data: { consumedAt: new Date() },
      });

      return tx.agentInstallation.create({
        data: {
          userId,
          deviceLabel: dto.deviceLabel,
          osFamily: dto.osFamily,
          agentVersion: dto.agentVersion,
          status: 'CONNECTED',
          tokenHash: sha256(agentToken),
          tokenExpiresAt,
          lastSeenAt: new Date(),
        },
      });
    });

    return {
      installation: publicInstallation(installation),
      agentToken,
      tokenExpiresAt,
    };
  }

  async listInstallations(userId: string) {
    const installations = await this.prisma.agentInstallation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return installations.map(publicInstallation);
  }

  async revoke(userId: string, id: string) {
    const installation = await this.prisma.agentInstallation.findUnique({ where: { id } });
    if (!installation) throw new NotFoundException('Agent installation not found');
    if (installation.userId !== userId) throw new ForbiddenException('Agent installation belongs to another user');

    const revoked = await this.prisma.agentInstallation.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        tokenHash: null,
        tokenExpiresAt: null,
      },
    });

    return publicInstallation(revoked);
  }
}
