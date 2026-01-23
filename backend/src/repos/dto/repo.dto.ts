import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepoDto {
  @ApiProperty({ example: 'my-project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'owner/my-project' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'https://github.com/owner/my-project' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ enum: ['GITHUB', 'GITLAB'] })
  @IsEnum(['GITHUB', 'GITLAB'])
  @IsNotEmpty()
  provider: 'GITHUB' | 'GITLAB';

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiProperty({ example: 'team-id' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({ example: 'main', required: false })
  @IsString()
  @IsOptional()
  branch?: string;
}

export class UpdateRepoDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  branch?: string;
}
