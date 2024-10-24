import { Injectable } from '@nestjs/common';
import { Constants } from 'src/infrastructure/utils/constants';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CameraRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllGroupBy(dateSeperator: string) {
    //date_trunc(${dateSeperator}, "public"."Camera"."createdAt") "date",
    return this.prismaService
      .$queryRaw`SELECT "public"."Camera"."name", count("userId"), date_trunc(${dateSeperator}, "public"."CameraOnUsers"."createdAt") "date"
                FROM "public"."Camera"
                INNER JOIN "public"."CameraOnUsers" ON "public"."Camera".id = "public"."CameraOnUsers"."cameraId"
                GROUP BY "public"."Camera"."name", "date"
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
