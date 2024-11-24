import { ApiProperty } from '@nestjs/swagger';
import { BlogStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class BlogPatchUpdateRequestDto {
  @ApiProperty({
    required: false,
    enum: BlogStatus,
  })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    type: 'file',
    required: false,
  })
  @IsOptional()
  @IsFile()
  @IsFile()
  @MaxFileSize(5e7)
  @HasMimeType(['image/*'])
  thumbnailFile?: MemoryStoredFile;
}
