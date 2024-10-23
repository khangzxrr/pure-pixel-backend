import { ApiProperty } from '@nestjs/swagger';
import { PhotoType, PhotoVisibility } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';
import { GpsDto } from '../gps.dto';

export class PhotoUpdateRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  watermark?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    required: false,
    enum: PhotoType,
  })
  @IsOptional()
  @IsEnum(PhotoType)
  photoType?: PhotoType;

  @ApiProperty({
    required: false,
    enum: PhotoVisibility,
  })
  @IsOptional()
  @IsEnum(PhotoVisibility)
  visibility?: PhotoVisibility;

  @ApiProperty({
    required: false,
    isArray: true,
    example: ['tag'],
  })
  @IsOptional()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  photoTags?: string[];

  @ApiProperty({
    type: GpsDto,
    required: false,
  })
  @IsOptional()
  gps?: GpsDto;
}
