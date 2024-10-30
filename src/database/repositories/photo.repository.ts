import { Injectable } from '@nestjs/common';
import { Photo, PhotoVisibility, Prisma } from '@prisma/client';

import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteQuery(photoId: string) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id: photoId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  updateManyQuery(args: Prisma.PhotoUpdateManyArgs) {
    return this.prisma.extendedClient().photo.updateMany(args);
  }

  batchUpdate(photo: Photo[]) {
    return photo.map((p) =>
      this.prisma.extendedClient().photo.update({
        where: {
          id: p.id,
        },
        data: p,
      }),
    );
  }

  updateQueryById(id: string, photo: Prisma.PhotoUpdateInput) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id,
      },
      data: photo,
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

  updateByIdQuery(id: string, photo: Prisma.PhotoUpdateInput) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id,
      },
      data: photo,
    });
  }

  async updateById(id: string, photo: Prisma.PhotoUpdateInput) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id,
      },
      data: photo,
    });
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

  async create(data: Prisma.PhotoCreateInput) {
    return this.prisma.extendedClient().photo.create({
      data,

      include: {
        photographer: true,
        categories: true,
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

  async findAllPhotosWithVoteAndCommentCountByUserId(photographerId: string) {
    return this.prisma.extendedClient().photo.findMany({
      where: {
        photographerId,
      },
      include: {
        photographer: true,
        categories: true,
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

  async findUniqueOrThrow(id: string) {
    return this.prisma.extendedClient().photo.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            votes: true,
          },
        },
        photographer: true,
        categories: true,
        camera: {
          include: {
            cameraMaker: true,
          },
        },
        photoSellings: {
          where: {
            active: true,
          },
          include: {
            pricetags: true,
          },
        },
        photoTags: true,
      },
    });
  }

  async count(filter: FindAllPhotoFilterDto) {
    return this.prisma.extendedClient().photo.count({
      where: filter.toWhere(),
    });
  }

  // async unaccentFindAll() {
  //   await this.prisma.$queryRaw(`SELECT unaccent(lower(title)) FROM "photo"`);
  // }
  //
  //
  async countByGPS(longitude: number, latitude: number, distance: number) {
    return this.prisma.$queryRaw`
                        SELECT COUNT(id) FROM 
                          (SELECT id, point(${longitude}, ${latitude}) <@>  (point((exif->>'longitude')::float, (exif->>'latitude')::float)::point) as distance	
                          FROM public."Photo" 
                          WHERE (point(${longitude}, ${latitude}) <@>  (point((exif->>'longitude')::float, (exif->>'latitude')::float)::point) < ${distance}))
`;
  }

  async findAllIdsByGPS(
    longitude: number,
    latitude: number,
    distance: number,
  ): Promise<any[]> {
    return this.prisma.$queryRaw`
                          SELECT id, point(${longitude}, ${latitude}) <@>  (point((exif->>'longitude')::float, (exif->>'latitude')::float)::point) as distance	
                          FROM public."Photo" 
                          WHERE (point(${longitude}, ${latitude}) <@>  (point((exif->>'longitude')::float, (exif->>'latitude')::float)::point) < ${distance})
`;
  }

  async findFirst(where: Prisma.PhotoWhereInput) {
    return this.prisma.extendedClient().photo.findFirst({
      where,
    });
  }

  async findAll(
    where: Prisma.PhotoWhereInput,
    orderBy: Prisma.PhotoOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return this.prisma.extendedClient().photo.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: {
          select: {
            votes: true,
          },
        },
        photographer: true,
        categories: true,
        camera: {
          include: {
            cameraMaker: true,
          },
        },
        photoSellings: {
          where: {
            active: true,
          },
          include: {
            pricetags: true,
          },
        },
        photoTags: true,
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
