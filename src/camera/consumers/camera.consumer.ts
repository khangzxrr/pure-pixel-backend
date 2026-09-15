import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CameraConstant } from '../constants/camera.constant';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { MissingModelExifException } from 'src/photo/exceptions/missing-model-exif.exception';
import { MissingMakeExifException } from 'src/photo/exceptions/missing-make-exif.exception';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { CameraOnUsersRepository } from 'src/database/repositories/camera-on-users.repository';

export interface AddNewCameraUsageJobData {
  photoId: string;
}

@Processor(CameraConstant.CAMERA_PROCESS_QUEUE, {})
export class CameraConsumer extends WorkerHost {
  private readonly logger = new Logger(CameraConsumer.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly cameraOnUsersRepository: CameraOnUsersRepository,
    @Inject() private readonly cameraRepository: CameraRepository,
  ) {
    super();
  }

  async process(job: Job<AddNewCameraUsageJobData>): Promise<void> {
    try {
      switch (job.name) {
        case CameraConstant.ADD_NEW_CAMERA_USAGE_JOB:
          await this.processCamera(job.data.photoId);
          break;
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  async processCamera(photoId: string) {
    this.logger.log(`process camera for photo ${photoId}`);
    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    const exif = photo.exif;
    const isExifObject =
      typeof exif === 'object' && exif !== null && !Array.isArray(exif);

    const model = isExifObject ? exif['Model'] : undefined;
    const make = isExifObject ? exif['Make'] : undefined;

    if (!model || typeof model !== 'string') {
      throw new MissingModelExifException();
    }

    if (!make || typeof make !== 'string') {
      throw new MissingMakeExifException();
    }

    const camera = await this.cameraRepository.upsert(model, make, photoId);

    await this.cameraOnUsersRepository.create(camera.id, photo.photographerId);

    this.logger.log(`upsert one photo for ${make} ${model}`);
  }
}
