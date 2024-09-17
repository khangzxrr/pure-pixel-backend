import { ApiProperty } from '@nestjs/swagger';
import { SignUrl } from './sign-urls.request.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { JsonValue } from '@prisma/client/runtime/library';

export class PhotoDto {
  @ApiProperty()
  id: string;

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
  photographer: UserEntity;
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
  }
}
