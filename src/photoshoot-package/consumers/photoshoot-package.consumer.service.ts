import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { PhotoshootPackageConstant } from '../constants/photoshoot-package.constant';
import { Job } from 'bullmq';
import { v4 } from 'uuid';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';

@Processor(PhotoshootPackageConstant.PHOTOSHOOT_PACKAGE_QUEUE, {
  concurrency: 6,
})
export class PhotoshootPackageConsumerService extends WorkerHost {
  constructor(
    @Inject()
    private readonly photoshootRepository: PhotoshootRepository,
    @Inject()
    private readonly photoProcessService: PhotoProcessService,
  ) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    switch (job.name) {
      case PhotoshootPackageConstant.UPLOAD_TO_CLOUD:
        await this.uploadToCloud(job.data);
        break;
      default:
        break;
    }
  }

  async uploadToCloud(photoshootPackageId: string) {
    const photoshootPackage =
      await this.photoshootRepository.findUniqueOrThrow(photoshootPackageId);

    if (photoshootPackage.sourceStatus === 'CLOUD') {
      return;
    }

    const thumbnailKey = `photoshoot_thumbnail/${v4()}.webp`;

    const sharp = await this.photoProcessService.sharpInitFromBuffer(
      createDto.thumbnail.buffer,
    );
    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);
    await this.photoProcessService.uploadFromBuffer(
      thumbnailKey,
      thumbnailBuffer,
    );

    const showcaseKeysPromises = createDto.showcases.map(async (showcase) => {
      const showcaseKey = `photoshoot_showcase/${v4()}.webp`;

      const showcaseSharp = await this.photoProcessService.sharpInitFromBuffer(
        showcase.buffer,
      );
      const showcaseThumbnailBuffer =
        await this.photoProcessService.makeThumbnail(showcaseSharp);
      await this.photoProcessService.uploadFromBuffer(
        showcaseKey,
        showcaseThumbnailBuffer,
      );

      return showcaseKey;
    });

    const showcaseKeys = await Promise.all(showcaseKeysPromises);
  }
}
