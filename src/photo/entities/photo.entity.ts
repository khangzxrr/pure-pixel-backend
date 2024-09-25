import {
  $Enums,
  Prisma,
  PhotoType,
  Photo as PrismaPhotoEntity,
  PhotoVisibility,
  PhotoStatus,
} from '@prisma/client';
import { PhotoDto } from '../dtos/photo.dto';

export class Photo implements PrismaPhotoEntity {
  id: string;
  photographerId: string;
  categoryId: string;
  title: string;
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

  size: number;

  createdAt: Date;
  updatedAt: Date;

  deletedAt: Date;

  constructor() {}

  static fromDto(photoDto: PhotoDto) {
    const photo = new Photo();

    let visibility: PhotoVisibility = PhotoVisibility.PUBLIC;

    if (photoDto.visibility == 'PRIVATE') {
      visibility = PhotoVisibility.PRIVATE;
    } else if (photoDto.visibility == 'PUBLIC') {
      visibility = PhotoVisibility.PUBLIC;
    } else {
      visibility = PhotoVisibility.SHARE_LINK;
    }

    photo.id = photoDto.id;
    photo.photographerId = photoDto.photographerId;
    photo.categoryId = photoDto.categoryId;
    photo.title = photoDto.title;
    photo.watermark = photoDto.watermark;
    photo.showExif = photoDto.showExif;
    photo.exif = photoDto.exif;
    photo.colorGrading = photoDto.colorGrading;
    photo.location = photoDto.location;
    photo.captureTime = photoDto.captureTime;
    photo.description = photoDto.description;
    photo.originalPhotoUrl = photoDto.originalPhotoUrl;
    photo.watermarkPhotoUrl = photoDto.watermarkPhotoUrl;
    photo.thumbnailPhotoUrl = photoDto.thumbnailPhotoUrl;
    photo.watermarkThumbnailPhotoUrl = photoDto.watermarkPhotoUrl;
    photo.photoType =
      photoDto.photoType == 'RAW' ? PhotoType.RAW : PhotoType.EDITED;
    photo.visibility = visibility;
    photo.status =
      photoDto.status == 'PENDING' ? PhotoStatus.PENDING : PhotoStatus.PARSED;
    photo.photoTags = photoDto.photoTags;
    photo.createdAt = photoDto.createdAt;
    photo.updatedAt = photoDto.updatedAt;

    return photo;
  }
}
