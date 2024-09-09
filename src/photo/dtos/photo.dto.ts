import { ApiProperty } from '@nestjs/swagger';
import { SignUrl } from './sign-urls.request.dto';

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
  exif?: string;

  @ApiProperty()
  colorGrading?: string;

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
}

export class SignedPhotoDto extends PhotoDto {
  @ApiProperty()
  signedUrl: SignUrl;
}
