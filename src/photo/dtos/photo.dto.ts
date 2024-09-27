import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignUrl } from './sign-urls.request.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { JsonValue } from '@prisma/client/runtime/library';
import { CategoryEntity } from '../entities/category.entity';

export class PhotoDto {
  @ApiProperty()
  id: string;

  //TODO: add share status, share payload to dto
  //
  //
  @ApiProperty()
  shareStatus: string;

  @ApiProperty()
  sharePayload: JsonValue;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  photographerId: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  watermark?: boolean;

  @ApiProperty()
  showExif?: boolean;

  @ApiProperty()
  exif?: JsonValue;

  @ApiProperty()
  colorGrading?: JsonValue;

  @ApiProperty()
  location?: string;

  @ApiProperty()
  captureTime?: Date;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  originalPhotoUrl: string;

  @ApiProperty()
  watermarkPhotoUrl: string;

  @ApiProperty()
  thumbnailPhotoUrl: string;

  @ApiProperty()
  watermarkThumbnailPhotoUrl: string;

  @ApiProperty()
  photoType?: string;

  @ApiProperty()
  visibility?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  photoTags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt?: Date;

  @ApiPropertyOptional()
  photographer?: UserEntity;

  @ApiPropertyOptional()
  category?: CategoryEntity;
}

export class SignedPhotoDto extends PhotoDto {
  @ApiProperty()
  signedUrl: SignUrl;

  constructor({ photographer, ...data }: Partial<PhotoDto>) {
    super();
    Object.assign(this, data);

    if (photographer) {
      this.photographer = new UserEntity(photographer);
    }

    if (data.category) {
      this.category = new CategoryEntity(data.category);
    }
  }
}
