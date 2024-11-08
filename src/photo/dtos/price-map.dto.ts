import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { PhotoConstant } from '../constants/photo.constant';
import { Type } from 'class-transformer';

export class PricetagDto {
  @ApiProperty()
  @Min(PhotoConstant.MIN_PHOTO_WIDTH)
  size: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  price: number;

  @ApiProperty()
  preview: string;
}
