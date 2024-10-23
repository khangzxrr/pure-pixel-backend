import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CameraMakerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cameraMaker.findMany({
      include: {
        cameras: {
          include: {
            CameraOnUsers: true,
          },
        },
      },
    });
  }
}
