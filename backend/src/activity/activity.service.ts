import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivitySessionDto, UpdateActivitySessionDto } from './dto/activity.dto';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateActivitySessionDto) {
    return this.prisma.activitySession.create({
      data: {
        userId,
        repoId: dto.repoId,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        durationMs: dto.durationMs,
        filesModified: dto.filesModified || [],
        linesAdded: dto.linesAdded,
        linesDeleted: dto.linesDeleted,
        commitCount: dto.commitCount || 0,
        metadata: dto.metadata || {},
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
        repo: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Activity session not found');
    }

    return session;
  }

  async findByUser(userId: string, options?: { limit?: number; offset?: number }) {
    return this.prisma.activitySession.findMany({
      where: { userId },
      include: {
        repo: true,
      },
      orderBy: { startTime: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  async findByUserAndDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.activitySession.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        repo: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByTeamAndDateRange(
    teamId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.activitySession.findMany({
      where: {
        user: {
          teamMemberships: {
            some: {
              teamId,
            },
          },
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
        repo: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async update(id: string, dto: UpdateActivitySessionDto) {
    return this.prisma.activitySession.update({
      where: { id },
      data: {
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        durationMs: dto.durationMs,
        filesModified: dto.filesModified,
        linesAdded: dto.linesAdded,
        linesDeleted: dto.linesDeleted,
        commitCount: dto.commitCount,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.activitySession.delete({
      where: { id },
    });
  }

  async getStatistics(userId: string, startDate: Date, endDate: Date) {
    const sessions = await this.prisma.activitySession.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalDuration = sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
    const totalCommits = sessions.reduce((sum, s) => sum + s.commitCount, 0);
    const totalLinesAdded = sessions.reduce((sum, s) => sum + (s.linesAdded || 0), 0);
    const totalLinesDeleted = sessions.reduce((sum, s) => sum + (s.linesDeleted || 0), 0);

    const uniqueFiles = new Set();
    sessions.forEach((s) => {
      const files = s.filesModified as string[] || [];
      files.forEach((f) => uniqueFiles.add(f));
    });

    return {
      totalSessions: sessions.length,
      totalDurationMs: totalDuration,
      totalCommits,
      totalLinesAdded,
      totalLinesDeleted,
      totalFilesModified: uniqueFiles.size,
    };
  }
}
