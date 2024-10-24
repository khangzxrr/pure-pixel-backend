import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PopularCameraTimelineRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(where: Prisma.PopularCameraTimelineWhereInput) {
    return this.prismaService.popularCameraTimeline.findMany({
      where,
      include: {
        popularCameraDataPoints: {
          include: {
            camera: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  async upsert(timestamp: Date) {
    return this.prismaService.popularCameraTimeline.upsert({
      where: {
        timestamp,
      },
      update: {},
      create: {
        timestamp,
      },
    });
  }
}
