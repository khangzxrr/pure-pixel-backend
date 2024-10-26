import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PhotoSellDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  photoSellId: string;

  @ApiProperty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  active: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  //dont exclude parent like Photo, this is a bug from class-transformer cause swagger to be null
  // @Exclude()
  // photo: PhotoDto;
}
