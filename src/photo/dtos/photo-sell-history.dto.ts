import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PhotoSellDto } from './photo-sell.dto';

export class PhotoSellHistoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  @Type(() => PhotoSellDto)
  originalPhotoSell: PhotoSellDto;
}
