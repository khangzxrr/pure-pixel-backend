import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { PhotoConstant } from '../constants/photo.constant';

export class PriceMapDto {
  @ApiProperty()
  @IsNumber()
  @Min(PhotoConstant.MIN_PHOTO_WIDTH)
  size: number;

  @ApiProperty()
  @IsNumber()
  @Min(1000)
  price: number;
}
