import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class PhotoshootPackageReplaceRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @ApiProperty({
    example: 10000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  price: number;

  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MaxFileSize(5e7)
  @HasMimeType(['image/*'])
  thumbnail: MemoryStoredFile;
}
