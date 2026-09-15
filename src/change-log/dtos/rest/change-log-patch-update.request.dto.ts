import { ApiProperty } from '@nestjs/swagger';
import { ChangeLogStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ChangeLogPatchUpdateRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiProperty({
    required: false,
    enum: ChangeLogStatus,
  })
  @IsOptional()
  @IsEnum(ChangeLogStatus)
  status?: ChangeLogStatus;
}
