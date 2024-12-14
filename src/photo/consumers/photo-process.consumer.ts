import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job, Queue } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { TineyeService } from 'src/storage/services/tineye.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { NotificationService } from 'src/notification/services/notification.service';
import { TemporaryPhotoDto } from '../dtos/temporary-photo.dto';
import { rm, writeFileSync } from 'fs';
import { TemporaryBookingPhotoUpload } from '../dtos/temporary-booking-photo-upload.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { Utils } from 'src/infrastructure/utils/utils';

@Processor(PhotoConstant.PHOTO_PROCESS_QUEUE, {
  concurrency: 6,
})
export class PhotoProcessConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoProcessConsumer.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly bookingRepository: BookingRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly tineyeService: TineyeService,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject() private readonly notificationService: NotificationService,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case PhotoConstant.UPLOAD_BOOKING_PHOTO_JOB_NAME:
          this.uploadBookingPhoto(job.data);
          break;
        case PhotoConstant.UPLOAD_PHOTO_JOB_NAME:
          await this.uploadToCloudStorage(job.data);
          break;
        case PhotoConstant.PROCESS_PHOTO_JOB_NAME:
          await this.processPhoto(job.data.id);
          break;
        case PhotoConstant.DELETE_PHOTO_JOB_NAME:
          await this.deleteTineyePhoto(job.data.originalPhotoUrl);
          break;
        case PhotoConstant.BAN_PHOTO_JOB:
          await this.banPhoto(job.data.id);
          break;
        case PhotoConstant.UNBAN_PHOTO_JOB:
          await this.unban(job.data.id);
          break;
        case PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME:
          this.deleteTemporaryPhoto(job.data);
          break;
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  deleteTemporaryPhoto(filepath: string) {
    rm(filepath, () => {
      this.logger.log(`removed temporary photo ${filepath}`);
    });
  }

  async banPhoto(id: string) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    await this.photoRepository.updateById(id, {
      status: 'BAN',
    });

    await this.notificationService.addNotificationToQueue({
      userId: photo.photographerId,
      type: 'IN_APP',
      title: `Ảnh ${photo.title} của bạn đã bị cấm trên hệ thống`,
      content:
        'Ảnh của bạn đã bị cấm trên hệ thống, nếu đây là sự nhầm lẫn vui lòng liên hệ với chúng tôi thông qua email',
      payload: {
        id,
      },
      referenceType: 'PHOTO_BAN',
    });
    this.logger.log(`banned photo: ${id}`);
  }

  async unban(id: string) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    await this.photoRepository.updateById(id, {
      status: 'PARSED',
    });

    await this.notificationService.addNotificationToQueue({
      userId: photo.photographerId,
      type: 'IN_APP',
      title: `Ảnh ${photo.title} của bạn đã được mở khoá trên hệ thống`,
      content:
        'Ảnh của bạn đã được mở khoá  trên hệ thống, nếu đây là sự nhầm lẫn vui lòng liên hệ với chúng tôi thông qua email',
      payload: {
        id,
      },
      referenceType: 'PHOTO_UNBAN',
    });
    this.logger.log(`unbanned photo: ${id}`);
  }

  async uploadBookingPhoto(temporaryPhoto: TemporaryBookingPhotoUpload) {
    console.log(`async upload booking ${temporaryPhoto.file}`);
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: temporaryPhoto.bookingId,
    });

    const photo = await this.photoRepository.findUniqueOrThrow(
      temporaryPhoto.photoId,
    );

    const sharp = await this.photoProcessService.sharpInitFromFilePath(
      temporaryPhoto.file.path,
    );

    const buffer = await sharp.toBuffer();
    if (buffer.length === 0) {
      this.logger.log(
        `temporary photo ${temporaryPhoto.file.path} of booking id: ${temporaryPhoto.bookingId}  is deleted form file system, skip`,
      );

      return;
    }

    const watermarkSharp = await this.photoProcessService.sharpInitFromFilePath(
      photo.watermarkPhotoUrl,
    );
    const watermarkBuffer = await watermarkSharp.toBuffer();

    const extension = Utils.getExtension(temporaryPhoto.file.path);

    const key = `${photo.photographerId}/${photo.id}.${extension}`;
    await this.bunnyService.uploadFromBuffer(key, buffer);

    const watermarkKey = `watermark/${key}`;
    await this.bunnyService.uploadFromBuffer(watermarkKey, watermarkBuffer);

    const thumbnailBuffer =
      await this.photoProcessService.thumbnailFromBuffer(buffer);
    await this.bunnyService.uploadFromBuffer(
      `thumbnail/${photo.id}.webp`,
      thumbnailBuffer,
    );

    const watermarkThumbnailBuffer =
      await this.photoProcessService.thumbnailFromBuffer(watermarkBuffer);
    const watermarkThumbnailKey = `thumbnail/watermark/${photo.id}.webp`;
    await this.bunnyService.uploadFromBuffer(
      watermarkThumbnailKey,
      watermarkThumbnailBuffer,
    );

    await this.photoRepository.updateById(photo.id, {
      status: 'PARSED',
      originalPhotoUrl: key,
      watermarkPhotoUrl: watermarkKey,
    });

    this.logger.log(
      `uploaded original photo / watermark photo for photo id : ${photo.id} from booking id: ${booking.id} to the cloud`,
    );

    this.photoProcessQueue.addBulk([
      {
        name: PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME,
        data: temporaryPhoto.file.path,
        opts: {
          delay: 3000, //delay prevent race condition
        },
      },
      {
        name: PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME,
        data: photo.watermarkPhotoUrl,
        opts: {
          delay: 3000, //delay prevent race condition
        },
      },
    ]);
  }

  async uploadToCloudStorage(temporaryPhoto: TemporaryPhotoDto) {
    console.log(`async upload ${temporaryPhoto.file}`);

    const photo = await this.photoRepository.findUniqueOrThrow(
      temporaryPhoto.photoId,
    );

    const sharp = await this.photoProcessService.sharpInitFromFilePath(
      temporaryPhoto.file.path,
    );

    //make sure to rotate buffer with exif
    const buffer = await sharp.rotate().withMetadata().toBuffer();

    if (buffer.length === 0) {
      this.logger.log(
        `temporary photo ${temporaryPhoto.photoId} is deleted form file system, skip`,
      );

      return;
    }

    const splitByDot = temporaryPhoto.file.path.split('.');
    const extension = splitByDot.at(-1);

    const key = `${photo.photographerId}/${photo.id}.${extension}`;
    await this.bunnyService.uploadFromBuffer(key, buffer);
    this.logger.log(`uploaded ${photo.id} to cloud`);

    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);
    await this.bunnyService.uploadFromBuffer(
      `thumbnail/${photo.id}.webp`,
      thumbnailBuffer,
    );
    this.logger.log(`uploaded thumbnail for photo id: ${photo.id}`);

    let removedMetaSharp = await this.photoProcessService.sharpInitFromFilePath(
      temporaryPhoto.file.path,
    );

    const watermark = await this.photoProcessService.makeWatermark(
      removedMetaSharp,
      'PXL',
    );

    console.log(removedMetaSharp);

    const watermarkBuffer = await watermark.toBuffer();

    console.log();
    const watermarkKey = `watermark/${key}`;
    await this.bunnyService.uploadFromBuffer(
      `watermark/${key}`,
      watermarkBuffer,
    );
    this.logger.log(`uploaded watermark for photo id: ${photo.id}`);

    const watermarkThumbnailBuffer =
      await this.photoProcessService.thumbnailFromBuffer(watermarkBuffer);

    const watermarkThumbnailKey = `thumbnail/watermark/${photo.id}.webp`;
    await this.bunnyService.uploadFromBuffer(
      watermarkThumbnailKey,
      watermarkThumbnailBuffer,
    );

    await this.photoRepository.updateById(photo.id, {
      status: 'PARSED',
      originalPhotoUrl: key,
      watermarkPhotoUrl: watermarkKey,
    });

    this.photoProcessQueue.addBulk([
      {
        name: PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME,
        data: temporaryPhoto.file.path,
        opts: {
          delay: 3000, //delay prevent race condition
        },
      },
      {
        name: PhotoConstant.DELETE_TEMPORARY_PHOTO_JOB_NAME,
        data: `/tmp/purepixel-local-storage/${photo.id}_watermark.${extension}`,
        opts: {
          delay: 3000, //delay prevent race condition
        },
      },
    ]);
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

    if (photo.photoType === 'BOOKING') {
      return;
    }

    const hash = await this.photoProcessService.getHashFromBuffer(buffer);

    const blurHash = await this.photoProcessService.bufferToBlurhash(buffer);

    const existPhotoWithHash = await this.photoRepository.findFirst({
      hash,
    });
    if (existPhotoWithHash) {
      await this.photoRepository.updateById(photo.id, {
        status: 'DUPLICATED',
        visibility: 'PRIVATE',
      });

      await this.notificationService.addNotificationToQueue({
        type: 'IN_APP',
        userId: photo.photographerId,
        payload: {
          id: photo.id,
        },
        referenceType: 'DUPLICATED_PHOTO',
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
          await this.photoRepository.updateById(photo.id, {
            status: 'DUPLICATED',
            visibility: 'PRIVATE',
          });

          await this.notificationService.addNotificationToQueue({
            type: 'IN_APP',
            userId: photo.photographerId,
            payload: {
              id: photo.id,
            },
            referenceType: 'DUPLICATED_PHOTO',
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
