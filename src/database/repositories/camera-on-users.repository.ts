import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CameraOnUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countUserByCameraMakerId(cameraMakerId: string) {
    return this.prisma.cameraOnUsers.count({
      where: {
        camera: {
          cameraMaker: {
            id: cameraMakerId,
          },
        },
      },
    });
  }

  async create(cameraId: string, userId: string) {
    return this.prisma.cameraOnUsers.upsert({
      where: {
        cameraId_userId: {
          cameraId,
          userId,
        },
      },
      update: {},
      create: {
        user: {
          connect: {
            id: userId,
          },
        },
        camera: {
          connect: {
            id: cameraId,
          },
        },
      },
    });
  }
}
