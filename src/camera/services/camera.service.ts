import { Inject, Injectable } from '@nestjs/common';
import { CameraMakerRepository } from 'src/database/repositories/camera-maker.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { MakerWithUserCountDto } from '../dtos/maker-with-user-count.dto';
import { plainToInstance } from 'class-transformer';
import { MakerDto } from '../dtos/maker.dto';
import { CameraOnUsersRepository } from 'src/database/repositories/camera-on-users.repository';
import { PopularCameraGraphRequestDto } from '../dtos/rest/popular-camera-graph.request.dto';

@Injectable()
export class CameraService {
  constructor(
    @Inject() private readonly cameraRepository: CameraRepository,
    @Inject() private readonly cameraMakerRepository: CameraMakerRepository,
    @Inject() private readonly cameraOnUsersRepository: CameraOnUsersRepository,
  ) {}

  async getPopularGraph(popularCameraGraphDto: PopularCameraGraphRequestDto) {
    return this.cameraRepository.findAllGroupBy(
      popularCameraGraphDto.seperator,
    );
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
