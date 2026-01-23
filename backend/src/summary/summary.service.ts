import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { LlmService } from './llm.service';
import { UpdateSummaryDto } from './dto/summary.dto';

@Injectable()
export class SummaryService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private llmService: LlmService,
  ) {}

  async generateForDate(userId: string, date: Date) {
    // Get all activity sessions for the date
    const sessions = await this.activityService.findByUserAndDate(userId, date);

    if (sessions.length === 0) {
      throw new NotFoundException('No activity found for this date');
    }

    // Calculate statistics
    const totalDurationMs = sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
    const totalCommits = sessions.reduce((sum, s) => sum + s.commitCount, 0);
    const totalFiles = new Set();
    let totalLinesAdded = 0;
    let totalLinesDeleted = 0;

    sessions.forEach((s) => {
      const files = s.filesModified as string[] || [];
      files.forEach((f) => totalFiles.add(f));
      totalLinesAdded += s.linesAdded || 0;
      totalLinesDeleted += s.linesDeleted || 0;
    });

    const filesModified = Array.from(totalFiles) as string[];

    // Generate summary using LLM
    const summaryText = await this.llmService.generateSummary({
      sessions,
      totalDuration: totalDurationMs,
      totalCommits,
      filesModified,
    });

    // Extract highlights (top files modified)
    const highlights = {
      topFiles: filesModified.slice(0, 10),
      linesChanged: totalLinesAdded + totalLinesDeleted,
    };

    // Save or update summary
    const existingSummary = await this.prisma.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: this.normalizeDate(date),
        },
      },
    });

    if (existingSummary) {
      return this.prisma.dailySummary.update({
        where: { id: existingSummary.id },
        data: {
          summary: summaryText,
          highlights,
          totalDurationMs,
          totalCommits,
          totalFiles: filesModified.length,
          isGenerated: true,
        },
      });
    } else {
      return this.prisma.dailySummary.create({
        data: {
          userId,
          date: this.normalizeDate(date),
          summary: summaryText,
          highlights,
          totalDurationMs,
          totalCommits,
          totalFiles: filesModified.length,
          isGenerated: true,
        },
      });
    }
  }

  async findOne(id: string) {
    const summary = await this.prisma.dailySummary.findUnique({
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
      },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return summary;
  }

  async findByUser(userId: string, options?: { limit?: number; offset?: number }) {
    return this.prisma.dailySummary.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: options?.limit || 30,
      skip: options?.offset || 0,
    });
  }

  async findByUserAndDate(userId: string, date: Date) {
    return this.prisma.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: this.normalizeDate(date),
        },
      },
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.dailySummary.findMany({
      where: {
        userId,
        date: {
          gte: this.normalizeDate(startDate),
          lte: this.normalizeDate(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async update(id: string, dto: UpdateSummaryDto) {
    return this.prisma.dailySummary.update({
      where: { id },
      data: dto,
    });
  }

  async validate(id: string) {
    return this.prisma.dailySummary.update({
      where: { id },
      data: { isValidated: true },
    });
  }

  async delete(id: string) {
    return this.prisma.dailySummary.delete({
      where: { id },
    });
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
