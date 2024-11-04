import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job, Queue } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { TineyeService } from 'src/storage/services/tineye.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';

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

    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case PhotoConstant.PROCESS_PHOTO_JOB_NAME:
          await this.processPhoto(job.data.id);
          break;
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  private async sendNotification(
    photoTitle: string,
    userId: string,
    referenceId: string,
  ) {
    const notificationCreateDto: NotificationCreateDto = {
      userId,
      referenceType: 'PHOTO',
      referenceId,
      type: 'BOTH_INAPP_EMAIL',
      title: `Ảnh ${photoTitle} của bạn trùng với một ảnh khác!`,
      content: `Ảnh ${photoTitle} của bạn có dấu hiệu trùng với một ảnh khác, nếu đây là sự sai sót, vui lòng báo cáo lên quản trị viên để được xem xét. Xin cám ơn!`,
    };

    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationCreateDto,
    );
  }

  async processPhoto(photoId: string) {
    console.log(`process photo id: ${photoId}`);

    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    const hash = await this.photoProcessService.getHashFromKey(
      photo.originalPhotoUrl,
    );

    const existPhotoWithHash = await this.photoRepository.findFirst({
      hash,
    });

    if (existPhotoWithHash) {
      await this.photoRepository.deleteById(photoId);

      await this.sendNotification(photo.title, photo.photographerId, photo.id);

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
          await this.photoRepository.deleteById(photoId);

          await this.sendNotification(
            photo.title,
            photo.photographerId,
            photo.id,
          );

          return;
        }
      }
    } catch (e) {
      console.log(e);
    }

    try {
      const data = await this.tineyeService.add(signedPhotoUrl);

      if (data.status === 200) {
        this.logger.log(`uploaded photo ${photo.originalPhotoUrl} to tineye`);
      }
    } catch (e) {
      console.log(e);
    }

    await this.photoRepository.updateById(photoId, {
      hash,
    });
  }
}
