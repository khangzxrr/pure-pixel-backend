import { Injectable } from '@nestjs/common';
import { PhotoVisibility } from '@prisma/client';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { SignedUpload } from 'src/photo/dtos/presigned-upload-url.response.dto';
import { Photo } from 'src/photo/entities/photo.entity';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async batchUpdate(photos: Photo[]) {
    const queries = photos.map((p) => {
      return this.prisma.photo.update({
        where: {
          id: p.id,
        },
        data: p,
      });
    });

    return this.prisma.$transaction(queries);
  }

  async getPhotoByIdsAndStatus(
    ids: string[],
    status: string,
    userId?: string,
  ): Promise<Photo[]> {
    return this.prisma.photo.findMany({
      where: {
        id: {
          in: ids,
        },
        status: status == 'PENDING' ? 'PENDING' : 'PARSED',
        photographerId: userId,
      },
    });
  }
  async deleteByExpiredUploadDate(date: Date, dayPassed: number) {
    const offset = dayPassed * 12 * 60 * 60 * 1000;
    const lastDay = date.getTime() - offset;
    //subtract days
    const newDate = new Date(lastDay);

    return this.prisma.photo.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: newDate,
        },
      },
    });
  }

  async createTemporaryPhotos(userId: string, signedUploads: SignedUpload[]) {
    //category can be null
    const photos = signedUploads.map((u) => {
      const photo = new Photo();
      photo.photographerId = userId;
      photo.originalPhotoUrl = u.storageObject;
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
      photo.title = '';
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

  async getPhotoByIdIncludePhotographer(id: string) {
    return this.prisma.photo.findUnique({
      where: {
        id,
      },
      include: {
        photographer: true,
        _count: {
          select: {
            votes: {
              where: {
                isUpvote: true,
              },
            },
            comments: true,
          },
        },
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

  async findAllIncludedPhotographer(filter: FindAllPhotoFilterDto) {
    return this.prisma.photo.findMany({
      where: filter.toWhere(),
      skip: filter.skip,
      take: filter.take,
      include: {
        photographer: true,
      },
    });
  }
  async findAllByVisibility(visibilityStr: string) {
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
