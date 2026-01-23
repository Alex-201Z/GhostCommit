import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepoDto, UpdateRepoDto } from './dto/repo.dto';

@Injectable()
export class ReposService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRepoDto) {
    // Check if repo already exists
    const existing = await this.prisma.repo.findUnique({
      where: {
        provider_externalId: {
          provider: dto.provider,
          externalId: dto.externalId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Repository already connected');
    }

    return this.prisma.repo.create({
      data: dto,
    });
  }

  async findOne(id: string) {
    const repo = await this.prisma.repo.findUnique({
      where: { id },
      include: {
        team: true,
        activitySessions: {
          take: 10,
          orderBy: { startTime: 'desc' },
        },
      },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    return repo;
  }

  async findByTeam(teamId: string) {
    return this.prisma.repo.findMany({
      where: { teamId },
      include: {
        activitySessions: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateRepoDto) {
    return this.prisma.repo.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.repo.delete({
      where: { id },
    });
  }

  async updateLastSynced(id: string) {
    return this.prisma.repo.update({
      where: { id },
      data: { lastSyncedAt: new Date() },
    });
  }
}
