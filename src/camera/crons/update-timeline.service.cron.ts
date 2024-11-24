import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { PopularCameraDatapointRepository } from 'src/database/repositories/popular-camera-data-point.repository';
import { PopularCameraTimelineRepository } from 'src/database/repositories/popular-camera-timeline.repository';
import { CameraUsageDto } from '../dtos/camera-usage.dto';
import { PrismaService } from 'src/prisma.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UpdateTimelineService {
  constructor(
    @Inject()
    private readonly popularCameraTimelineRepository: PopularCameraTimelineRepository,
    @Inject()
    private readonly popularCameraDatapointRepository: PopularCameraDatapointRepository,
    @Inject()
    private readonly cameraRepository: CameraRepository,
    private readonly prismaService: PrismaService,
  ) {}

  private async generateDataForTimestamp(date: Date) {
    const timeline = await this.popularCameraTimelineRepository.upsert(date);
    const topUsage = (await this.cameraRepository.findTopUsageAtTimestamp(
      'day',
      5,
      date,
    )) as any[];

    const dtos = plainToInstance(CameraUsageDto, topUsage);

    const prismaPromises = dtos.map((c) =>
      this.popularCameraDatapointRepository.upsert(
        timeline.id,
        c.id,
        c.userCount,
      ),
    );

    await this.prismaService.$transaction(prismaPromises);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async triggerCron() {
    const date = new Date();

    const countPreviousTimeline =
      await this.popularCameraTimelineRepository.count({
        timestamp: {
          lte: date,
        },
      });

    if (countPreviousTimeline < 7) {
      for (let i = 1; i <= 7; i++) {
        const preDate = new Date(date.getTime() - 1000 * 60 * 60 * 24 * i);
        await this.generateDataForTimestamp(preDate);

        console.log(`generate camera to data point for timestamp ${preDate}`);
      }
    }

    await this.generateDataForTimestamp(date);
    console.log(`generate camera to data point for timestamp ${date}`);
  }
}
