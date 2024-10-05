import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignUrl } from './sign-urls.request.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { JsonValue } from '@prisma/client/runtime/library';
import { CategoryEntity } from '../entities/category.entity';
import { Exclude, Type } from 'class-transformer';

export class PhotoDto {
  @ApiProperty({
    required: true
  })
  id: string;

  @ApiProperty({
    required: false
  })
  shareStatus?: string;

  @Exclude()
  @ApiProperty({
    required: false,
  })
  sharePayload?: JsonValue;

  @ApiProperty({
    required: false,
  })
  categoryId?: string;

  @ApiProperty({
    required: false,
  })
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
  colorGrading?: JsonValue;

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
  @Type(() => UserEntity)
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
