import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PhotoSellDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  photoSellId: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  afterPhotoUrl: string;

  @ApiProperty()
  active: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
