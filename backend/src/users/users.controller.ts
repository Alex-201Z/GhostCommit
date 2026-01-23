import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: Request) {
    return this.usersService.findOne((req.user as any).id);
  }

  @Get('me/teams')
  @ApiOperation({ summary: 'Get current user teams' })
  async getMyTeams(@Req() req: Request) {
    return this.usersService.getTeams((req.user as any).id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @Req() req: Request,
    @Body() data: { name?: string; username?: string },
  ) {
    return this.usersService.update((req.user as any).id, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
