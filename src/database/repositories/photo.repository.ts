import { Injectable } from '@nestjs/common';
import { PhotoVisibility } from '@prisma/client';
import { SignedUpload } from 'src/photo/dtos/presigned-upload-url.response.dto';
import { Photo } from 'src/photo/entities/photo.entity';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTemporaryPhotos(userId: string, signedUploads: SignedUpload[]) {
    //TODO: catch exception when category is not found
    const category = await this.prisma.category.findFirst({
      select: {
        id: true,
      },
    });

    const photos = signedUploads.map((u) => {
      const photo = new Photo();
      photo.photographerId = userId;
      photo.originalPhotoUrl = u.storageObject;
      photo.categoryId = category.id;
      photo.location = '';
      photo.photoType = 'RAW';
      photo.watermarkThumbnailPhotoUrl = '';
      photo.thumbnailPhotoUrl = '';
      photo.watermarkPhotoUrl = '';
      photo.description = '';
      photo.captureTime = new Date();
      photo.colorGrading = {};
      photo.exif = {};
      photo.showExif = false;
      photo.watermark = false;
      photo.visibility = 'PRIVATE';
      photo.status = 'PENDING';
      photo.photoTags = [];

      return photo;
    });

    return this.prisma.photo.createManyAndReturn({
      data: photos,

      select: {
        id: true,
        originalPhotoUrl: true,
      },
    });
  }

  async getPhotoById(id: string) {
    return this.prisma.photo.findUnique({
      where: {
        id,
      },
    });
  }
  async getAllByVisibility(visibilityStr: string) {
    let visibility: PhotoVisibility = PhotoVisibility.PUBLIC;

    if (visibilityStr == PhotoVisibility.PRIVATE) {
      visibility = PhotoVisibility.PRIVATE;
    } else if (visibilityStr == PhotoVisibility.SHARE_LINK) {
      visibility = PhotoVisibility.SHARE_LINK;
    }

    return this.prisma.photo.findMany({
      where: {
        visibility,
      },
    });
  }
}
