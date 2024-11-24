import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { Exclude, Type } from 'class-transformer';
import { PhotographerDTO } from 'src/photographer/dtos/photographer.dto';
import { PhotoTagDto } from './photo-tag.dto';
import { PhotoCategoryDto } from './photo-category.dto';
import { PhotoSellDto } from './photo-sell.dto';

export class PhotoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  blurHash: string;

  @ApiProperty({})
  title: string;

  @ApiProperty({})
  watermark: boolean;

  @ApiProperty()
  viewCount: number;

  @ApiProperty({})
  exif: JsonValue;

  @ApiProperty({})
  description: string;

  @Exclude()
  originalPhotoUrl: string;

  @Exclude()
  watermarkPhotoUrl: string;

  @Exclude()
  thumbnailPhotoUrl: string;

  @Exclude()
  deletedAt: Date;

  @Exclude()
  bookingId: string;

  @Exclude()
  photographerId: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty({})
  photoType: string;

  @ApiProperty({})
  visibility: string;

  @ApiProperty({})
  status: string;

  @ApiProperty({})
  createdAt: Date;

  @ApiProperty({})
  updatedAt: Date;

  @ApiProperty({})
  @Type(() => PhotographerDTO)
  photographer: PhotographerDTO;

  @ApiProperty({
    required: false,
    isArray: true,
    type: PhotoSellDto,
  })
  @Type(() => PhotoSellDto)
  photoSellings: PhotoSellDto[];

  @ApiProperty({
    required: false,
    isArray: true,
    type: PhotoTagDto,
  })
  @Type(() => PhotoTagDto)
  photoTags: PhotoTagDto[];

  @ApiProperty({
    required: false,
    isArray: true,
    type: PhotoCategoryDto,
  })
  @Type(() => PhotoCategoryDto)
  categories: PhotoCategoryDto[];
}
