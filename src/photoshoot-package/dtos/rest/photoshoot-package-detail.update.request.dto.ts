import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class PhotoshootPackageDetailUpdateDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  descriptions?: string[];
}
