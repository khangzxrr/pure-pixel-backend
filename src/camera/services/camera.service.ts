import { Inject, Injectable } from '@nestjs/common';
import { CameraMakerRepository } from 'src/database/repositories/camera-maker.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { MakerWithUserCountDto } from '../dtos/maker-with-user-count.dto';
import { plainToInstance } from 'class-transformer';
import { MakerDto } from '../dtos/maker.dto';
import { CameraOnUsersRepository } from 'src/database/repositories/camera-on-users.repository';

import { PopularCameraTimelineRepository } from 'src/database/repositories/popular-camera-timeline.repository';
import { PopularCameraTimelineDto } from '../dtos/popular-camera-timeline.dto';

@Injectable()
export class CameraService {
  constructor(
    @Inject() private readonly cameraRepository: CameraRepository,
    @Inject() private readonly cameraMakerRepository: CameraMakerRepository,
    @Inject() private readonly cameraOnUsersRepository: CameraOnUsersRepository,
    @Inject()
    private readonly popularCameraTimeline: PopularCameraTimelineRepository,
  ) {}

  async getPopularGraph() {
    const startDate = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7);

    const timeline = await this.popularCameraTimeline.findMany({
      timestamp: {
        gte: startDate,
      },
    });

    return plainToInstance(PopularCameraTimelineDto, timeline);
  }

  async findTopCameraOfBrand(brandId: string, take: number) {
    return await this.cameraRepository.findByMakerId(brandId, take);
  }

  async findTopBrand(n: number) {
    const result = await this.cameraMakerRepository.findAll();

    const makerWithUserCountPromises = result.map(
      async (m): Promise<MakerWithUserCountDto> => {
        const userCount =
          await this.cameraOnUsersRepository.countUserByCameraMakerId(m.id);

        return {
          maker: plainToInstance(MakerDto, m),
          userCount,
        };
      },
    );

    const makerWithUserCountDtos = await Promise.all(
      makerWithUserCountPromises,
    );

    return makerWithUserCountDtos
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, n);
  }
}
