import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    type: 'file',
  })
  @IsOptional()
  @IsFile()
  @MaxFileSize(10485760)
  @HasMimeType(['image/*'])
  cover?: MemoryStoredFile;

  @ApiPropertyOptional({
    type: 'file',
  })
  @IsOptional()
  @IsFile()
  @MaxFileSize(10485760)
  @HasMimeType(['image/*'])
  avatar?: MemoryStoredFile;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  quote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  mail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  socialLinks?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  expertises?: string[];
}
