import { Injectable } from '@nestjs/common';
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
        thumbnail: 'model_thumbnail',
        cameraMaker: {
          connectOrCreate: {
            where: {
              name: make,
            },
            create: {
              name: make,
              thumbnail: 'camera_maker_thumbnail',
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
