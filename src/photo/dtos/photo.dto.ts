import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { Exclude, Type } from 'class-transformer';
import { PhotographerDTO } from 'src/photographer/dtos/photographer.dto';
import { PhotoSellDto } from './photo-sell.dto';
import { PhotoTagDto } from './photo-tag.dto';
import { PhotoCategoryDto } from './photo-category.dto';

export class PhotoDto {
  @ApiProperty()
  id: string;

  @ApiProperty({})
  shareStatus: string;

  @Exclude()
  sharePayload: JsonValue;

  @Exclude()
  photographerId: string;

  @ApiProperty({})
  title: string;

  @ApiProperty({})
  watermark: boolean;

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
  watermarkThumbnailPhotoUrl: string;

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
  deletedAt: Date;

  @ApiProperty({})
  @Type(() => PhotographerDTO)
  photographer: PhotographerDTO;

  @ApiProperty({
    required: false,
    isArray: true,
  })
  //must specific type here
  @Type(() => PhotoSellDto)
  photoSellings: PhotoSellDto[];

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PhotoTagDto)
  photoTags: PhotoTagDto[];

  @ApiProperty({
    required: false,
    isArray: true,
  })
  @Type(() => PhotoCategoryDto)
  categories: PhotoCategoryDto[];
}
