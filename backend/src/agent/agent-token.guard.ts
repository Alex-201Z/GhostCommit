import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface AgentAuthenticatedRequest extends Request {
  agentInstallation?: {
    id: string;
    userId: string;
  };
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AgentTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AgentAuthenticatedRequest>();
    const authorization = request.header('authorization') ?? '';
    const match = authorization.match(/^Bearer (gca_[A-Za-z0-9_-]+)$/);
    if (!match) {
      throw new UnauthorizedException('Invalid agent token');
    }

    const installation = await this.prisma.agentInstallation.findUnique({
      where: { tokenHash: sha256(match[1]) },
      select: {
        id: true,
        userId: true,
        status: true,
        revokedAt: true,
        tokenExpiresAt: true,
      },
    });

    if (
      !installation ||
      installation.status === 'REVOKED' ||
      installation.revokedAt ||
      !installation.tokenExpiresAt ||
      installation.tokenExpiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid agent token');
    }

    request.agentInstallation = {
      id: installation.id,
      userId: installation.userId,
    };
    return true;
  }
}
