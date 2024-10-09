import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { PhotoDto } from './photo.dto';

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

  @Exclude()
  photo: PhotoDto;
}
