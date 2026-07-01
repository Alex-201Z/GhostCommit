import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

type ProjectTrackingStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

function publicProject(repo: {
  id: string;
  name: string;
  displayName: string | null;
  provider: string;
  localAlias: string | null;
  branch: string | null;
  trackingStatus: ProjectTrackingStatus;
  ignoredPatterns: unknown;
  includeFilePathsInReports: boolean;
  excludedFromReports: boolean;
  archivedAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: repo.id,
    displayName: repo.displayName || repo.name,
    gitProvider: repo.provider,
    localAlias: repo.localAlias,
    branch: repo.branch,
    trackingStatus: repo.trackingStatus,
    ignoredPatterns: Array.isArray(repo.ignoredPatterns) ? repo.ignoredPatterns : [],
    includeFilePathsInReports: repo.includeFilePathsInReports,
    excludedFromReports: repo.excludedFromReports,
    archivedAt: repo.archivedAt,
    lastActivityAt: repo.lastActivityAt,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
  };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const workspace = await this.prisma.team.findUnique({
      where: { personalOwnerId: userId },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Personal workspace not found');

    const repo = await this.prisma.repo.create({
      data: {
        name: dto.displayName,
        displayName: dto.displayName,
        fullName: dto.localAlias,
        localAlias: dto.localAlias,
        url: `ghostcommit-local://${encodeURIComponent(dto.localAlias)}`,
        provider: dto.gitProvider,
        externalId: randomUUID(),
        teamId: workspace.id,
        branch: dto.branch || 'main',
        trackingStatus: 'ACTIVE',
        isActive: true,
        ignoredPatterns: dto.ignoredPatterns || [],
      },
    });

    return publicProject(repo);
  }

  async list(userId: string, status?: ProjectTrackingStatus) {
    const repos = await this.prisma.repo.findMany({
      where: {
        team: { personalOwnerId: userId },
        ...(status ? { trackingStatus: status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return repos.map(publicProject);
  }

  async get(userId: string, id: string) {
    return publicProject(await this.getOwnedRepo(userId, id));
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    await this.getOwnedRepo(userId, id);
    const repo = await this.prisma.repo.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        name: dto.displayName,
        localAlias: dto.localAlias,
        ignoredPatterns: dto.ignoredPatterns,
        includeFilePathsInReports: dto.includeFilePathsInReports,
        excludedFromReports: dto.excludedFromReports,
      },
    });
    return publicProject(repo);
  }

  async pause(userId: string, id: string) {
    return this.setStatus(userId, id, 'PAUSED');
  }

  async resume(userId: string, id: string) {
    return this.setStatus(userId, id, 'ACTIVE');
  }

  async archive(userId: string, id: string) {
    await this.getOwnedRepo(userId, id);
    const repo = await this.prisma.repo.update({
      where: { id },
      data: {
        trackingStatus: 'ARCHIVED',
        isActive: false,
        archivedAt: new Date(),
      },
    });
    return publicProject(repo);
  }

  private async setStatus(userId: string, id: string, status: Exclude<ProjectTrackingStatus, 'ARCHIVED'>) {
    await this.getOwnedRepo(userId, id);
    const repo = await this.prisma.repo.update({
      where: { id },
      data: {
        trackingStatus: status,
        isActive: status === 'ACTIVE',
      },
    });
    return publicProject(repo);
  }

  private async getOwnedRepo(userId: string, id: string) {
    const repo = await this.prisma.repo.findUnique({
      where: { id },
      include: { team: { select: { personalOwnerId: true } } },
    });
    if (!repo) throw new NotFoundException('Project not found');
    if (repo.team.personalOwnerId !== userId) throw new ForbiddenException('Project belongs to another user');
    return repo;
  }
}
