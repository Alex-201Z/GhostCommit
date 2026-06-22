import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding/status')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}
  @Get()
  @ApiOperation({ summary: 'Return onboarding status for the authenticated user' })
  get(@Req() req: Request) {
    return this.onboarding.get((req.user as { id: string }).id);
  }
  @Patch()
  @ApiOperation({ summary: 'Record explicit versioned privacy consent' })
  update(@Req() req: Request, @Body() dto: UpdateOnboardingDto) {
    return this.onboarding.update((req.user as { id: string }).id, dto);
  }
}
