import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}
  get(userId: string) {
    return this.prisma.onboardingStatus.findUniqueOrThrow({
      where: { userId },
      include: {
        user: {
          select: { privacyConsents: { orderBy: { acceptedAt: 'desc' } }, personalWorkspace: true },
        },
      },
    });
  }
  async update(userId: string, dto: UpdateOnboardingDto) {
    await this.prisma.$transaction([
      this.prisma.privacyConsent.upsert({
        where: { userId_policyVersion: { userId, policyVersion: dto.policyVersion } },
        update: { source: dto.source },
        create: { userId, policyVersion: dto.policyVersion, source: dto.source },
      }),
      this.prisma.onboardingStatus.upsert({
        where: { userId },
        update: { currentStep: 'PRIVACY_ACCEPTED' },
        create: { userId, currentStep: 'PRIVACY_ACCEPTED' },
      }),
    ]);
    return this.get(userId);
  }
}
