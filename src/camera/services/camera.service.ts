import { Inject, Injectable } from '@nestjs/common';
import { CameraMakerRepository } from 'src/database/repositories/camera-maker.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { MakerWithUserCountDto } from '../dtos/maker-with-user-count.dto';
import { plainToInstance } from 'class-transformer';
import { MakerDto } from '../dtos/maker.dto';
import { CameraOnUsersRepository } from 'src/database/repositories/camera-on-users.repository';

import { PopularCameraTimelineRepository } from 'src/database/repositories/popular-camera-timeline.repository';
import { PopularCameraTimelineDto } from '../dtos/popular-camera-timeline.dto';
import { UpdateCameraDto } from '../dtos/rest/update-camera.dto';
import { BunnyService } from 'src/storage/services/bunny.service';
import { FindAllCameraDto } from '../dtos/rest/find-all-camera.dto';
import { CameraDto } from '../dtos/camera.dto';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';

@Injectable()
export class CameraService {
  constructor(
    @Inject() private readonly cameraRepository: CameraRepository,
    @Inject() private readonly cameraMakerRepository: CameraMakerRepository,
    @Inject() private readonly cameraOnUsersRepository: CameraOnUsersRepository,
    @Inject()
    private readonly popularCameraTimeline: PopularCameraTimelineRepository,
    @Inject() private readonly bunnyService: BunnyService,
  ) {}

  async findById(id: string) {
    const camera = this.cameraRepository.findFindOrThrow(id);

    return plainToInstance(CameraDto, camera);
  }

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
    const topCameras: any[] = await this.cameraRepository.findByMakerId(
      brandId,
      take,
    );

    return plainToInstance(CameraDto, topCameras);
  }

  async findTopBrand(n: number) {
    const result = await this.cameraMakerRepository.findAll();

    const makerWithUserCountPromises = result.map(
      async (m): Promise<MakerWithUserCountDto> => {
        const makerDto = plainToInstance(MakerDto, m);

        const topCameraDtos = await this.findTopCameraOfBrand(m.id, 5);
        makerDto.cameras = topCameraDtos;

        const userCount =
          await this.cameraOnUsersRepository.countUserByCameraMakerId(m.id);

        return {
          maker: makerDto,
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

  async findAll(findAllDto: FindAllCameraDto) {
    const count = await this.cameraRepository.count(findAllDto.toWhere());
    const cameras: any[] = await this.cameraRepository.findMany(
      findAllDto.toWhere(),
      {},
      findAllDto.toSkip(),
      findAllDto.limit,
      findAllDto.toOrderBy(),
    );

    const cameraDtos = plainToInstance(CameraDto, cameras);

    return new PagingPaginatedResposneDto<CameraDto>(
      findAllDto.limit,
      count,
      cameraDtos,
    );
  }

  async update(id: string, updateDto: UpdateCameraDto) {
    const camera = await this.cameraRepository.findUniqueOrThrow({
      id,
    });

    if (updateDto.thumbnail) {
      //temporary use
      camera.thumbnail = await this.bunnyService.uploadPublic(
        updateDto.thumbnail,
        `${camera.id}.${updateDto.thumbnail.extension}`,
      );
    }

    return await this.cameraRepository.update(
      {
        id,
      },
      {
        name: updateDto.name,
        thumbnail: camera.thumbnail,
        description: updateDto.description,
      },
    );
  }

  async delete(id: string) {
    return await this.cameraRepository.delete({
      id,
    });
  }
}
