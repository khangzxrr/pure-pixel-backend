export class PhotoDto {
  id: string;
  categoryId: string;
  photographerId: string;

  watermark: boolean;
  showExif: boolean;

  exif: string;
  colorGrading: string;

  location: string;
  captureTime: string;

  description: string;

  originalPhotoUrl: string;
  watermarkPhotoUrl: string;

  thumbnailPhotoUrl: string;
  watermarkThumbnailPhotoUrl: string;

  photoType: string;
  visibility: string;

  status: string;

  photoTags: string[];

  createdAt: string;
  updatedAt: string;
}
