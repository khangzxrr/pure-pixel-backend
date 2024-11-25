import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job, Queue } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { TineyeService } from 'src/storage/services/tineye.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';
import { NotificationService } from 'src/notification/services/notification.service';

@Processor(PhotoConstant.PHOTO_PROCESS_QUEUE, {
  concurrency: 2,
})
export class PhotoProcessConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoProcessConsumer.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly tineyeService: TineyeService,
    @Inject() private readonly bunnyService: BunnyService,

    @Inject() private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case PhotoConstant.PROCESS_PHOTO_JOB_NAME:
          await this.processPhoto(job.data.id);
          break;
        case PhotoConstant.DELETE_PHOTO_JOB_NAME:
          await this.deleteTineyePhoto(job.data.originalPhotoUrl);
          break;
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  async deleteTineyePhoto(originalPhotoUrl: string) {
    await this.tineyeService.delete(originalPhotoUrl);

    this.logger.log(`delete ${originalPhotoUrl} from tineye database`);
  }

  async generateThumbnail(photoId: string, buffer: Buffer) {
    const sharp = await this.photoProcessService.sharpInitFromBuffer(buffer);

    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);

    await this.bunnyService.uploadFromBuffer(
      `thumbnail/${photoId}.webp`,
      thumbnailBuffer,
    );

    this.logger.log(`generated thumbnail for photo id: ${photoId}`);
  }

  async processPhoto(photoId: string) {
    console.log(`process photo id: ${photoId}`);

    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    const buffer = await this.photoProcessService.getBufferFromKey(
      photo.originalPhotoUrl,
    );

    await this.generateThumbnail(photoId, buffer);

    const hash = await this.photoProcessService.getHashFromBuffer(buffer);

    const blurHash = await this.photoProcessService.bufferToBlurhash(buffer);

    const existPhotoWithHash = await this.photoRepository.findFirst({
      hash,
    });
    if (existPhotoWithHash) {
      await this.photoRepository.deleteById(photoId, photo.size);

      await this.notificationService.addNotificationToQueue({
        type: 'IN_APP',
        userId: photo.photographerId,
        payload: {},
        referenceType: 'PHOTO',
        title: `Ảnh ${photo.title} của bạn trùng với một ảnh khác!`,
        content: `Ảnh ${photo.title} của bạn có dấu hiệu trùng với một ảnh khác, nếu đây là sự sai sót, vui lòng báo cáo lên quản trị viên để được xem xét. Xin cám ơn!`,
      });

      return;
    }

    const signedPhotoUrl = this.bunnyService.getPresignedFile(
      photo.originalPhotoUrl,
      `?width=${PhotoConstant.TINEYE_MIN_PHOTO_WIDTH}`,
    );

    try {
      const response = await this.tineyeService.search(signedPhotoUrl);

      const result = response.data.result;

      if (result) {
        if (result.length > 0 && result[0].match_percent >= 10) {
          await this.photoRepository.deleteById(photoId, photo.size);

          await this.notificationService.addNotificationToQueue({
            type: 'IN_APP',
            userId: photo.photographerId,
            payload: {},
            referenceType: 'PHOTO',
            title: `Ảnh ${photo.title} của bạn trùng với một ảnh khác!`,
            content: `Ảnh ${photo.title} của bạn có dấu hiệu trùng với một ảnh khác, nếu đây là sự sai sót, vui lòng báo cáo lên quản trị viên để được xem xét. Xin cám ơn!`,
          });

          return;
        }
      }
    } catch (e) {
      console.log(e);
    }

    try {
      const data = await this.tineyeService.add(
        photo.originalPhotoUrl,
        signedPhotoUrl,
      );

      if (data.status === 200) {
        this.logger.log(`uploaded photo ${photo.originalPhotoUrl} to tineye`);
      }
    } catch (e) {
      console.log(e);
    }

    await this.photoRepository.updateById(photoId, {
      hash,
      blurHash,
    });
  }
}
