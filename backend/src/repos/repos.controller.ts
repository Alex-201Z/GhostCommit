import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReposService } from './repos.service';
import { CreateRepoDto, UpdateRepoDto } from './dto/repo.dto';

@ApiTags('Repositories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repos')
export class ReposController {
  constructor(private reposService: ReposService) {}

  @Post()
  @ApiOperation({ summary: 'Connect a new repository' })
  async create(@Body() dto: CreateRepoDto) {
    return this.reposService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repository by ID' })
  async getRepo(@Param('id') id: string) {
    return this.reposService.findOne(id);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get all repositories for a team' })
  async getTeamRepos(@Param('teamId') teamId: string) {
    return this.reposService.findByTeam(teamId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update repository' })
  async update(@Param('id') id: string, @Body() dto: UpdateRepoDto) {
    return this.reposService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect repository' })
  async delete(@Param('id') id: string) {
    return this.reposService.delete(id);
  }
}
