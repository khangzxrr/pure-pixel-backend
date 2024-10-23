import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CameraConstant } from '../constants/camera.constant';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PhotoRepository } from 'src/database/repositories/photo.repository';

@Processor(CameraConstant.CAMERA_PROCESS_QUEUE, {
  concurrency: 2,
})
export class CameraConsumer extends WorkerHost {
  private readonly logger = new Logger(CameraConsumer.name);

  constructor(@Inject() private readonly photoRepository: PhotoRepository) {
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
  }
}
