import { ApiProperty } from '@nestjs/swagger';
import { BlogStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class BlogPutUpdateRequestDto {
  @ApiProperty({
    enum: BlogStatus,
  })
  @IsEnum(BlogStatus)
  status: BlogStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: 'file',
  })
  @IsOptional()
  @IsFile()
  @IsFile()
  @MaxFileSize(5e7)
  @HasMimeType(['image/*'])
  thumbnailFile: MemoryStoredFile;
}
