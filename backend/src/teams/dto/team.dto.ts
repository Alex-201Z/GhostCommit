import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'My Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'my-team' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Team description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTeamDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AddTeamMemberDto {
  @ApiProperty({ example: 'user-id' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER'] })
  @IsEnum(['OWNER', 'ADMIN', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}
