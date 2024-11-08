import { ApiProperty } from '@nestjs/swagger';
import { PricetagDto } from './price-map.dto';
import { Type } from 'class-transformer';
import { PhotoSellHistoryDto } from './photo-sell-history.dto';

export class PhotoSellDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  photoSellId: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  active: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    isArray: true,
    type: PricetagDto,
  })
  @Type(() => PricetagDto)
  pricetags: PricetagDto[];

  @ApiProperty({
    isArray: true,
    type: PhotoSellHistoryDto,
  })
  @Type(() => PhotoSellHistoryDto)
  photoSellHistories: PhotoSellHistoryDto[];

  //dont exclude parent like Photo, this is a bug from class-transformer cause swagger to be null
  // @Exclude()
  // photo: PhotoDto;
}
