import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const SAFE_ALIAS = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,79}$/u;
const SAFE_IGNORE_PATTERN = /^[A-Za-z0-9._*/!-]{1,120}$/;

export class CreateProjectDto {
  @ApiProperty({ example: 'GhostCommit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  displayName: string;

  @ApiProperty({ enum: ['LOCAL', 'GITHUB'] })
  @IsString()
  @IsIn(['LOCAL', 'GITHUB'])
  gitProvider: 'LOCAL' | 'GITHUB';

  @ApiProperty({ example: 'ghostcommit-dev' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(SAFE_ALIAS)
  localAlias: string;

  @ApiPropertyOptional({ example: 'main' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  branch?: string;

  @ApiPropertyOptional({ example: ['dist/**', '.env*'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Matches(SAFE_IGNORE_PATTERN, { each: true })
  ignoredPatterns?: string[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'GhostCommit' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: 'ghostcommit-dev' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(SAFE_ALIAS)
  localAlias?: string;

  @ApiPropertyOptional({ example: ['dist/**', '.env*'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Matches(SAFE_IGNORE_PATTERN, { each: true })
  ignoredPatterns?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  includeFilePathsInReports?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  excludedFromReports?: boolean;
}
