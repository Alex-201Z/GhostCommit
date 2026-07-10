import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const SAFE_LABEL = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,79}$/u;

export class AgentLinkRequestDto {
  @ApiProperty({ example: 'Windows dev laptop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(SAFE_LABEL)
  deviceLabel: string;

  @ApiPropertyOptional({ enum: ['windows', 'macos', 'linux'] })
  @IsOptional()
  @IsString()
  @IsIn(['windows', 'macos', 'linux'])
  osFamily?: string;

  @ApiPropertyOptional({ example: '0.1.0' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  agentVersion?: string;
}

export class AgentLinkConfirmDto extends AgentLinkRequestDto {
  @ApiProperty({ example: 'GC-123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^GC-[A-Z0-9]{6}$/)
  linkCode: string;
}
