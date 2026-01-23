import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto/team.dto';
import { Request } from 'express';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  async create(@Req() req: Request, @Body() dto: CreateTeamDto) {
    return this.teamsService.create((req.user as any).id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async getTeam(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update team' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, (req.user as any).id, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add team member' })
  async addMember(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(id, (req.user as any).id, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove team member' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.teamsService.removeMember(id, (req.user as any).id, userId);
  }
}
