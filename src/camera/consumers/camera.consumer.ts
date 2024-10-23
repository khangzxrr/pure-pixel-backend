import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CameraConstant } from '../constants/camera.constant';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoNotFoundException } from 'src/photo/exceptions/photo-not-found.exception';
import { MissingModelExifException } from 'src/photo/exceptions/missing-model-exif.exception';
import { MissingMakeExifException } from 'src/photo/exceptions/missing-make-exif.exception';
import { CameraRepository } from 'src/database/repositories/camera.repository';

@Processor(CameraConstant.CAMERA_PROCESS_QUEUE, {})
export class CameraConsumer extends WorkerHost {
  private readonly logger = new Logger(CameraConsumer.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly cameraRepository: CameraRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
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
    const photo = await this.photoRepository.getPhotoById(photoId);

    if (photo == null) {
      throw new PhotoNotFoundException();
    }

    const model = photo.exif['Model'];
    const make = photo.exif['Make'];

    if (!model) {
      throw new MissingModelExifException();
    }

    if (!make) {
      throw new MissingMakeExifException();
    }

    await this.cameraRepository.upsert(model, make, photoId);

    this.logger.log(`upsert one photo for ${make} ${model}`);
  }
}
