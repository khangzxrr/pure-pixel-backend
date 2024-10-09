import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { ShareStatus } from '@prisma/client';

@Processor(PhotoConstant.PHOTO_SHARE_QUEUE)
export class PhotoShareConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoShareConsumer.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case PhotoConstant.GENERATE_SHARE_JOB_NAME:
          this.generateSharePayload(job.data.photoId);
          break;
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  async generateSharePayload(photoId: string) {
    this.logger.log(`generate share payload for photo ${photoId}`);

    const photo = await this.photoRepository.getPhotoById(photoId);

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photo.originalPhotoUrl,
    );

    const availableResolutions =
      await this.photoProcessService.getAvailableResolution(
        photo.originalPhotoUrl,
      );

    const sharePayload = {};

    for (const res of availableResolutions) {
      const buffer = await this.photoProcessService.resize(
        sharp,
        PhotoConstant.PHOTO_RESOLUTION_BIMAP[res],
      );

      const key = `${res}/${photo.originalPhotoUrl}`;
      sharePayload[res] = key;

      await this.photoProcessService.uploadFromBuffer(key, buffer);
    }

    photo.shareStatus = ShareStatus.READY;
    photo.sharePayload = sharePayload;

    const updatedPhoto = await this.photoRepository.updatePhotoShare(
      photo.id,
      ShareStatus.READY,
      sharePayload,
    );

    await this.photoGateway.sendDataToUserId(
      photo.photographerId,
      'generated-multiple-share-resolutions',
      updatedPhoto,
    );
  }
}
