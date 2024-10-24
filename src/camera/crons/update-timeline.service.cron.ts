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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async triggerCron() {
    const previousDate = new Date(new Date().getTime() - 1000 * 60 * 60 * 24);
    const nextDate = new Date(new Date().getTime() + 1000 * 60 * 60 * 24);

    const startDate = new Date(previousDate.toDateString());
    const endDate = new Date(nextDate.toDateString());

    console.log(`upsert ${startDate.toString()} popular camera timeline`);

    const timeline =
      await this.popularCameraTimelineRepository.upsert(startDate);

    const topUsage = (await this.cameraRepository.findTopUsageAtTimestamp(
      'day',
      5,
      startDate,
      endDate,
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

    console.log(`add ${dtos.length} camera to data point`);
  }
}
