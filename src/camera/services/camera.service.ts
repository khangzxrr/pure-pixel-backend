import { Inject, Injectable } from '@nestjs/common';
import { CameraMakerRepository } from 'src/database/repositories/camera-maker.repository';
import { CameraRepository } from 'src/database/repositories/camera.repository';

@Injectable()
export class CameraService {
  constructor(
    @Inject() private readonly cameraRepository: CameraRepository,
    @Inject() private readonly cameraMakerRepository: CameraMakerRepository,
  ) {}

  async findTopBrand(n: number) {
    //Apple
    //user1 -> some photos -> some camera --> any maker = APPle
    const result = await this.cameraMakerRepository.findAll();

    console.log(result[1].cameras[0].CameraOnUsers);

    return result;
  }
}
