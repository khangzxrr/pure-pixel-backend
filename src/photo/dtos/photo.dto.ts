import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PhotoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @IsOptional()
  categoryId: string;

  @ApiProperty()
  photographerId: string;

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
