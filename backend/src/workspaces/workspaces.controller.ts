import { Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}
  @Post('personal')
  @HttpCode(200)
  @ApiOperation({ summary: 'Idempotently create the authenticated user personal workspace' })
  createPersonal(@Req() req: Request) {
    return this.workspaces.ensurePersonal((req.user as { id: string }).id);
  }
}
