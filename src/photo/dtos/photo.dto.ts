import { ApiProperty } from '@nestjs/swagger';
import { SignUrl } from './rest/sign-urls.request.dto';
import { JsonValue } from '@prisma/client/runtime/library';
import { Exclude, Type } from 'class-transformer';
import { PhotographerDTO } from 'src/photographer/dtos/photographer.dto';
import { PhotoSellDto } from './photo-sell.dto';
import { SignedUrl } from './photo-signed-url.dto';

export class PhotoDto {
  @ApiProperty({
    required: true,
  })
  id: string;

  @ApiProperty({
    required: false,
  })
  shareStatus?: string;

  @Exclude()
  @ApiProperty({
    required: false,
  })
  sharePayload?: JsonValue;

  @Exclude()
  categoryId?: string;

  @Exclude()
  photographerId?: string;

  @ApiProperty({
    required: false,
  })
  title?: string;

  @ApiProperty({
    required: false,
  })
  watermark?: boolean;

  @ApiProperty({
    required: false,
  })
  showExif?: boolean;

  @ApiProperty({
    required: false,
  })
  exif?: JsonValue;

  @ApiProperty({
    required: false,
  })
  location?: string;

  @ApiProperty({
    required: false,
  })
  captureTime?: Date;

  @ApiProperty({
    required: false,
  })
  description?: string;

  @Exclude()
  originalPhotoUrl: string;

  @Exclude()
  watermarkPhotoUrl: string;

  @Exclude()
  thumbnailPhotoUrl: string;

  @Exclude()
  watermarkThumbnailPhotoUrl: string;

  @ApiProperty({
    required: false,
  })
  photoType?: string;

  @ApiProperty({
    required: false,
  })
  visibility?: string;

  @ApiProperty({
    required: false,
  })
  status?: string;

  @ApiProperty({
    required: false,
  })
  photoTags?: string[];

  @ApiProperty({
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    required: false,
  })
  updatedAt?: Date;

  @ApiProperty({
    required: false,
  })
  deletedAt?: Date;

  @ApiProperty({
    required: false,
  })
  @Type(() => PhotographerDTO)
  photographer?: PhotographerDTO;

  @ApiProperty({
    required: false,
    isArray: true,
  })
  //must specific type here
  @Type(() => PhotoSellDto)
  photoSellings: PhotoSellDto[];
}

export class SignedPhotoDto extends PhotoDto {
  @ApiProperty()
  @Type(() => SignedUrl)
  signedUrl: SignUrl;
}
