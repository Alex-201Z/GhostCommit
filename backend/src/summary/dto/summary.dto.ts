import { IsNotEmpty, IsDateString, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSummaryDto {
  @ApiProperty({ example: '2024-01-23' })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class UpdateSummaryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isValidated?: boolean;
}

export class ExportSummaryDto {
  @ApiProperty({ example: '2024-01-23' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2024-01-30' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ enum: ['markdown', 'pdf'], example: 'markdown' })
  @IsString()
  @IsNotEmpty()
  format: 'markdown' | 'pdf';
}
