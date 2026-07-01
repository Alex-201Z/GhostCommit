import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentService } from './agent.service';
import { AgentLinkConfirmDto, AgentLinkRequestDto } from './dto/agent-link.dto';

@ApiTags('Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Post('link-request')
  @ApiOperation({ summary: 'Create a short-lived local agent link request' })
  createLinkRequest(@Req() req: Request, @Body() dto: AgentLinkRequestDto) {
    return this.agent.createLinkRequest((req.user as { id: string }).id, dto);
  }

  @Post('link/confirm')
  @ApiOperation({ summary: 'Confirm a local agent link request and issue a device token once' })
  confirmLink(@Req() req: Request, @Body() dto: AgentLinkConfirmDto) {
    return this.agent.confirmLink((req.user as { id: string }).id, dto);
  }

  @Get('installations')
  @ApiOperation({ summary: 'List local agent installations for the authenticated user' })
  installations(@Req() req: Request) {
    return this.agent.listInstallations((req.user as { id: string }).id);
  }

  @Post('installations/:id/revoke')
  @ApiOperation({ summary: 'Revoke an agent installation immediately' })
  revoke(@Req() req: Request, @Param('id') id: string) {
    return this.agent.revoke((req.user as { id: string }).id, id);
  }
}
