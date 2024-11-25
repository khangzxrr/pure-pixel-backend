import { Injectable } from '@nestjs/common';
import { Photo, Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteById(photoId: string) {
    return this.prisma.extendedClient().photo.update({
      where: {
        id: photoId,
      },
      data: {
        deletedAt: new Date(),
        photoSellings: {
          updateMany: {
            where: {
              photoId,
            },
            data: {
              active: false,
            },
          },
        },
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

  async findUniqueOrThrow(id: string, userId?: string) {
    return this.prisma.extendedClient().photo.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            votes: true,
            comments: true,
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
            photoSellHistories: {
              include: {
                photoBuy: {
                  where: {
                    buyerId: userId,
                    userToUserTransaction: {
                      fromUserTransaction: {
                        status: 'SUCCESS',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        photoTags: true,
      },
    });
  }

  async count(where: Prisma.PhotoWhereInput) {
    return this.prisma.extendedClient().photo.count({
      where,
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
                          (SELECT id, point(${latitude}, ${longitude}) <@>  (point((exif->>'latitude')::float, (exif->>'longitude')::float)::point) as distance
                          FROM public."Photo" 
                          WHERE point(${latitude}, ${longitude}) <@>  (point((exif->>'latitude')::float, (exif->>'longitude')::float)::point) < ${distance})
`;
  }

  async findAllIdsByGPS(
    longitude: number,
    latitude: number,
    distance: number,
  ): Promise<any[]> {
    return this.prisma.$queryRaw`
                          SELECT id, point(${latitude}, ${longitude}) <@>  (point((exif->>'latitude')::float, (exif->>'longitude')::float)::point) as distance
                          FROM public."Photo" 
                          WHERE  point(${latitude}, ${longitude}) <@>  (point((exif->>'latitude')::float, (exif->>'longitude')::float)::point) < ${distance}
                          ORDER BY point(${latitude}, ${longitude}) <@>  (point((exif->>'latitude')::float, (exif->>'longitude')::float)::point)
`;
  }

  async findFirst(where: Prisma.PhotoWhereInput) {
    return this.prisma.extendedClient().photo.findFirst({
      where,
    });
  }

  async findAllWithoutPaging(where: Prisma.PhotoWhereInput) {
    return this.prisma.extendedClient().photo.findMany({
      where,
    });
  }

  async findAll(
    where: Prisma.PhotoWhereInput,
    orderBy: Prisma.PhotoOrderByWithRelationInput[],
    skip: number,
    take: number,
    cursor?: Prisma.PhotoWhereUniqueInput,
  ) {
    return this.prisma.extendedClient().photo.findMany({
      where,
      skip,
      take,
      orderBy,
      cursor,
      include: {
        _count: {
          select: {
            votes: true,
            comments: true,
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
}
