import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SignedPhotoBuyDto } from './rest/signed-photo-buy.response.dto';
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

  @ApiProperty({
    type: () => SignedPhotoBuyDto,
  })
  @Type(() => SignedPhotoBuyDto)
  photoBuy: SignedPhotoBuyDto;

  // @ApiProperty()
  // @Type(() => PhotoSellDto)
  // originalPhotoSell: PhotoSellDto;
}
