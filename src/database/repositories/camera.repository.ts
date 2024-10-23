import { Injectable } from '@nestjs/common';
import { Constants } from 'src/infrastructure/utils/constants';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CameraRepository {
  constructor(private readonly prismaService: PrismaService) {}
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
