import { ConsentSource } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsEnum, IsString, Matches } from 'class-validator';

export class UpdateOnboardingDto {
  @ApiProperty({ example: true })
  @Equals(true)
  privacyPolicyAccepted: true;

  @ApiProperty({ example: true })
  @Equals(true)
  hasReadCollectionNotice: true;

  @ApiProperty({ example: true })
  @Equals(true)
  understandsDataControl: true;

  @ApiProperty({ example: '2026-06-22' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  policyVersion: string;

  @ApiProperty({ enum: ConsentSource, example: ConsentSource.ONBOARDING })
  @IsEnum(ConsentSource)
  source: ConsentSource;
}
