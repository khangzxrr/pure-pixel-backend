import { Injectable } from '@nestjs/common';
import { PhotoVisibility } from '@prisma/client';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { Photo } from 'src/photo/entities/photo.entity';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(photoId: string) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id: photoId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async update(photo: Photo) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id: photo.id,
      },
      data: photo,
    });
  }

  batchUpdate(photos: Photo[]) {
    const queries = photos.map((p) => {
      return this.prisma.extendedClient().photo.update({
        where: {
          id: p.id,
        },
        data: p,
      });
    });

    return queries;
  }

  async getPhotoByIdAndStatusAndUserId(
    id: string,
    status: string,
    userId: string,
  ): Promise<Photo> {
    return this.prisma.extendedClient().photo.findUnique({
      where: {
        id: id,
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

    return this.prisma.extendedClient().photo.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: newDate,
        },
      },
    });
  }

  async createTemporaryPhotos(userId: string, originalPhotoUrl: string) {
    //find a better way to do this
    const category = await this.prisma.category.findFirstOrThrow({
      where: {
        name: 'khác',
      },
      select: {
        id: true,
      },
    });

    const photo = new Photo();
    photo.photographerId = userId;
    photo.originalPhotoUrl = originalPhotoUrl;
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
    photo.title = '';
    photo.photoTags = [];

    return this.prisma.extendedClient().photo.create({
      data: photo,

      select: {
        id: true,
        originalPhotoUrl: true,
      },
    });
  }

  async findAllPhotosWithVoteAndCommentCountByUserId(photographerId: string) {
    return this.prisma.extendedClient().photo.findMany({
      where: {
        photographerId,
      },
      include: {
        photographer: true,
        category: true,
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

  async getPhotoDetailById(id: string) {
    return this.prisma.extendedClient().photo.findUnique({
      where: {
        id,
      },
      include: {
        photographer: true,
        category: true,
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
    return this.prisma.extendedClient().photo.findUnique({
      where: {
        id,
      },
    });
  }

  async findAllIncludedPhotographer(filter: FindAllPhotoFilterDto) {
    return this.prisma.extendedClient().photo.findMany({
      where: filter.toWhere(),
      skip: filter.skip,
      take: filter.take,
      include: {
        photographer: true,
        category: true,
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

    return this.prisma.extendedClient().photo.findMany({
      where: {
        visibility,
      },
    });
  }
}
