import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  HasMimeType,
  IsFile,
  IsFiles,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class PhotoshootPackageCreateRequestDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MaxFileSize(5e7)
  @HasMimeType(['image/*'])
  thumbnail: MemoryStoredFile;

  @ApiProperty({
    type: 'file',
    isArray: true,
  })
  @IsFiles()
  @MaxFileSize(5e7, {
    each: true,
  })
  @HasMimeType(['image/*'], { each: true })
  @ArrayMaxSize(20)
  showcases: MemoryStoredFile[];
}
