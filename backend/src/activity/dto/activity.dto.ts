import { IsNotEmpty, IsString, IsDateString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivitySessionDto {
  @ApiProperty({ example: '2024-01-23T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2024-01-23T12:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ example: 7200000, required: false })
  @IsNumber()
  @IsOptional()
  durationMs?: number;

  @ApiProperty({ example: ['src/app.ts', 'src/config.ts'], required: false })
  @IsOptional()
  filesModified?: string[];

  @ApiProperty({ example: 120, required: false })
  @IsNumber()
  @IsOptional()
  linesAdded?: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  linesDeleted?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  commitCount?: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ example: 'repo-id', required: false })
  @IsString()
  @IsOptional()
  repoId?: string;
}

export class UpdateActivitySessionDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  durationMs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  filesModified?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  linesAdded?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  linesDeleted?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  commitCount?: number;
}
