import { PhotoStatus } from '@prisma/client';

export class PhotoProcessDto {
  id: string;
  originalPhotoUrl: string;
  thumbnailPhotoUrl: string;
  watermarkPhotoUrl: string;
  watermarkThumbnailPhotoUrl: string;
  status: PhotoStatus;
  size: number;
  constructor(
    id: string,
    originalPhotoUrl: string,
    thumbnailPhotoUrl: string,
    watermarkPhotoUrl: string,
    watermarkThumbnailPhotoUrl: string,
    status: PhotoStatus,
    size: number,
  ) {
    this.id = id;
    this.originalPhotoUrl = originalPhotoUrl;
    this.thumbnailPhotoUrl = thumbnailPhotoUrl;
    this.watermarkPhotoUrl = watermarkPhotoUrl;
    this.watermarkThumbnailPhotoUrl = watermarkThumbnailPhotoUrl;
    this.status = status;
    this.size = size;
  }
}
