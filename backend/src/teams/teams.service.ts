import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTeamDto) {
    // Check if slug is already taken
    const existing = await this.prisma.team.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Team slug already exists');
    }

    // Create team and add creator as owner
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return team;
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        repos: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async update(teamId: string, userId: string, dto: UpdateTeamDto) {
    await this.checkTeamPermission(teamId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.team.update({
      where: { id: teamId },
      data: dto,
    });
  }

  async addMember(teamId: string, userId: string, dto: AddTeamMemberDto) {
    await this.checkTeamPermission(teamId, userId, ['OWNER', 'ADMIN']);

    const existing = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: dto.userId,
          teamId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a team member');
    }

    return this.prisma.teamMember.create({
      data: {
        userId: dto.userId,
        teamId,
        role: dto.role || 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async removeMember(teamId: string, userId: string, memberUserId: string) {
    await this.checkTeamPermission(teamId, userId, ['OWNER', 'ADMIN']);

    const member = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberUserId,
          teamId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove team owner');
    }

    return this.prisma.teamMember.delete({
      where: { id: member.id },
    });
  }

  private async checkTeamPermission(
    teamId: string,
    userId: string,
    allowedRoles: string[],
  ) {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}
