import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { CreateActivitySessionDto, UpdateActivitySessionDto } from './dto/activity.dto';
import { Request } from 'express';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new activity session (used by agent)' })
  async create(@Req() req: Request, @Body() dto: CreateActivitySessionDto) {
    return this.activityService.create((req.user as any).id, dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get activity session by ID' })
  async getSession(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get current user activity sessions' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getMySessions(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.activityService.findByUser((req.user as any).id, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('sessions/date/:date')
  @ApiOperation({ summary: 'Get activity sessions for a specific date' })
  async getSessionsByDate(@Req() req: Request, @Param('date') date: string) {
    return this.activityService.findByUserAndDate(
      (req.user as any).id,
      new Date(date),
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get activity statistics for a date range' })
  @ApiQuery({ name: 'startDate' })
  @ApiQuery({ name: 'endDate' })
  async getStatistics(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.activityService.getStatistics(
      (req.user as any).id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Update activity session' })
  async update(@Param('id') id: string, @Body() dto: UpdateActivitySessionDto) {
    return this.activityService.update(id, dto);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete activity session' })
  async delete(@Param('id') id: string) {
    return this.activityService.delete(id);
  }
}
