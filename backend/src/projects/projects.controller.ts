import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an explicitly authorized tracked project' })
  create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    return this.projects.create((req.user as { id: string }).id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects owned by the authenticated user' })
  list(@Req() req: Request, @Query('status') status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
    return this.projects.list((req.user as { id: string }).id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one project owned by the authenticated user' })
  get(@Req() req: Request, @Param('id') id: string) {
    return this.projects.get((req.user as { id: string }).id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project privacy settings' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update((req.user as { id: string }).id, id, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause tracking for a project' })
  pause(@Req() req: Request, @Param('id') id: string) {
    return this.projects.pause((req.user as { id: string }).id, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume tracking for a project' })
  resume(@Req() req: Request, @Param('id') id: string) {
    return this.projects.resume((req.user as { id: string }).id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a project and stop tracking' })
  archive(@Req() req: Request, @Param('id') id: string) {
    return this.projects.archive((req.user as { id: string }).id, id);
  }
}
