import { ApiProperty } from '@nestjs/swagger';
import {
  PhotoStatus,
  PhotoType,
  PhotoVisibility,
  ShareStatus,
} from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import {
  IsBoolean,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';

export class PhotoUpdateRequestDto {
  @ApiProperty({
    required: false,
    enum: ShareStatus,
  })
  @IsOptional()
  @IsEnum(ShareStatus)
  shareStatus?: ShareStatus;

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
  @IsJSON()
  exif?: JsonValue;

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
    enum: PhotoStatus,
  })
  @IsOptional()
  @IsEnum(PhotoStatus)
  status?: PhotoStatus;

  @ApiProperty({
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  photoTags?: string[];
}
