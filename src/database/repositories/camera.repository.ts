import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Constants } from 'src/infrastructure/utils/constants';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CameraRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUniqueOrThrow(where: Prisma.CameraWhereUniqueInput) {
    return this.prismaService.extendedClient().camera.findUniqueOrThrow({
      where,
    });
  }

  async delete(where: Prisma.CameraWhereUniqueInput) {
    return this.prismaService.extendedClient().camera.delete({
      where,
    });
  }

  async update(
    where: Prisma.CameraWhereUniqueInput,
    data: Prisma.CameraUpdateInput,
  ) {
    return this.prismaService.extendedClient().camera.update({
      where,
      data,
    });
  }

  count(where?: Prisma.CameraWhereInput) {
    return this.prismaService.extendedClient().camera.count({
      where,
    });
  }

  findMany(
    where?: Prisma.CameraWhereInput,
    include?: Prisma.CameraInclude,
    skip?: number,
    take?: number,
    orderBy?: Prisma.CameraOrderByWithRelationInput[],
  ) {
    return this.prismaService.extendedClient().camera.findMany({
      where,
      include,
      skip,
      take,
      orderBy,
    });
  }

  findFindOrThrow(id: string) {
    return this.prismaService.extendedClient().camera.findFirstOrThrow({
      where: {
        id,
      },
    });
  }

  async findByMakerId(makerId: string, take: number) {
    return this.prismaService.camera.findMany({
      take,
      where: {
        cameraMaker: {
          id: makerId,
        },
      },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        _count: {
          select: {
            photos: {
              where: {
                deletedAt: null,
                visibility: 'PUBLIC',
              },
            },
            cameraOnUsers: true,
          },
        },
      },

      orderBy: [
        {
          photos: {
            _count: 'desc',
          },
        },
        {
          cameraOnUsers: {
            _count: 'desc',
          },
        },
      ],
    });
  }

  async findTopOrderByPhotoCount(
    search: string,
    sortOrder: Prisma.SortOrder,
    skip: number,
    take: number,
  ): Promise<any[]> {
    return this.prismaService
      .$queryRaw`SELECT *, (SELECT COUNT(*) FROM public."Photo" WHERE "deletedAt" IS NULL AND "cameraId" = public."Camera"."id") as "photoCount", 
                  (SELECT COUNT(*)  FROM public."CameraOnUsers" WHERE "cameraId" = public."Camera"."id") as "userCount"
                FROM "public"."Camera"
                WHERE LOWER(public."Camera"."name") LIKE LOWER(CONCAT('%', ${search}, '%'))
                ORDER BY "photoCount" ${sortOrder === 'asc' ? Prisma.sql(['asc']) : Prisma.sql(['desc'])} 
                OFFSET ${skip}
                LIMIT ${take} 
                `;
  }

  async findTopUsageByUserCount(
    search: string,
    sortOrder: Prisma.SortOrder,
    skip: number,
    take: number,
  ): Promise<any[]> {
    return this.prismaService
      .$queryRaw`SELECT *, (SELECT COUNT(*) FROM public."Photo" WHERE "deletedAt" IS NULL AND "cameraId" = public."Camera"."id") as "photoCount", 
                  (SELECT COUNT(*)  FROM public."CameraOnUsers" WHERE "cameraId" = public."Camera"."id") as "userCount"
                FROM "public"."Camera"
                WHERE LOWER(public."Camera"."name") LIKE LOWER(CONCAT('%', ${search}, '%'))
                ORDER BY "userCount" ${sortOrder === 'asc' ? Prisma.sql(['asc']) : Prisma.sql(['desc'])} 
                OFFSET ${skip}
                LIMIT ${take} 
                `;
  }

  async findTopUsageAtTimestamp(
    dateSeperator: string,
    limit: number,
    endDate: Date,
  ): Promise<any[]> {
    //date_trunc(${dateSeperator}, "public"."Camera"."createdAt") "date",
    return this.prismaService
      .$queryRaw`SELECT "public"."Camera"."id", "public"."Camera"."name", count("userId") as "userCount", date_trunc(${dateSeperator}, "public"."CameraOnUsers"."createdAt") "date"
                FROM "public"."Camera"
                INNER JOIN "public"."CameraOnUsers" ON "public"."Camera".id = "public"."CameraOnUsers"."cameraId"
                WHERE "public"."CameraOnUsers"."createdAt" < ${endDate}
                GROUP BY "public"."Camera"."id", "public"."Camera"."name", "date"
                ORDER BY "userCount" DESC
                LIMIT ${limit}
                `;
  }

  async upsert(model: string, make: string, photoId: string) {
    return this.prismaService.camera.upsert({
      where: {
        name: model,
      },
      update: {
        photos: {
          connect: {
            id: photoId,
          },
        },
      },
      create: {
        name: model,
        thumbnail: Constants.DEFAULT_IMAGE,
        cameraMaker: {
          connectOrCreate: {
            where: {
              name: make,
            },
            create: {
              name: make,
              thumbnail: Constants.DEFAULT_IMAGE,
            },
          },
        },
        photos: {
          connect: {
            id: photoId,
          },
        },
      },
    });
  }
}
