import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}
  async ensurePersonal(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.team.upsert({
      where: { personalOwnerId: userId },
      update: {},
      create: {
        personalOwnerId: userId,
        name: `${user.name || user.username || 'Developer'} workspace`,
        slug: `personal-${userId}`,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { members: true },
    });
  }
}
