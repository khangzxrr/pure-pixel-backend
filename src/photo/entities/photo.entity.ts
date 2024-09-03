import { $Enums, Prisma, Photo as PrismaPhotoEntity } from '@prisma/client';

export class Photo implements PrismaPhotoEntity {
  id: string;
  photographerId: string;
  categoryId: string;
  watermark: boolean;
  showExif: boolean;
  exif: Prisma.JsonValue;
  colorGrading: Prisma.JsonValue;
  location: string;
  captureTime: Date;
  description: string;
  originalPhotoUrl: string;
  watermarkPhotoUrl: string;
  thumbnailPhotoUrl: string;
  watermarkThumbnailPhotoUrl: string;
  photoType: $Enums.PhotoType;
  visibility: $Enums.PhotoVisibility;
  status: $Enums.PhotoStatus;
  photoTags: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor() {}
}
