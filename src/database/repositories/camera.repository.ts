import { Injectable } from '@nestjs/common';
import { Constants } from 'src/infrastructure/utils/constants';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CameraRepository {
  constructor(private readonly prismaService: PrismaService) {}

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
        _count: {
          select: {
            photos: true,
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
