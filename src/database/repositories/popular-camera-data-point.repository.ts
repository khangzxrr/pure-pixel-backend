import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PopularCameraDatapointRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(timelineId: string, cameraId: string, count: number) {
    return this.prisma.popularCameraDataPoint.upsert({
      where: {
        cameraId_timelineId: {
          cameraId,
          timelineId,
        },
      },
      update: {},
      create: {
        camera: {
          connect: {
            id: cameraId,
          },
        },
        timeline: {
          connect: {
            id: timelineId,
          },
        },
        userCount: count,
      },
    });
  }
}
