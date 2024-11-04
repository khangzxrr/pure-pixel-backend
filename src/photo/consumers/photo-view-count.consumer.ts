import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Logger, Inject } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessConsumer } from './photo-process.consumer';

@Processor(PhotoConstant.PHOTO_VIEWCOUNT_QUEUE, {
  concurrency: 1,
})
export class PhotoViewCountConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoProcessConsumer.name);

  constructor(@Inject() private readonly photoRepository: PhotoRepository) {
    super();
  }
  async process(job: Job): Promise<any> {
    try {
      if (job.name === PhotoConstant.INCREASE_VIEW_COUNT_JOB) {
        await this.increasePhotoViewCount(job.data.id);
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);

      throw new Error();
    }
    return null;
  }

  async increasePhotoViewCount(photoId: string) {
    return await this.photoRepository.updateById(photoId, {
      viewCount: {
        increment: 1,
      },
    });
  }
}
