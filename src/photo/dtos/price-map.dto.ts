import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

import { Type } from 'class-transformer';

import { PhotoConstant } from '../constants/photo.constant';

export class PricetagDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(PhotoConstant.MIN_PHOTO_WIDTH)
  width: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  height: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  price: number;

  @ApiProperty()
  preview: string;
}
