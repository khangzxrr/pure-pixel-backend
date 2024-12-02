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

  async uploadBookingPhoto(temporaryPhoto: TemporaryBookingPhotoUpload) {
    console.log(`async upload booking ${temporaryPhoto.file}`);
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: temporaryPhoto.bookingId,
    });

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

    const metadata = await sharp.metadata();

    const watermark = await this.photoProcessService.makeWatermark(
      sharp,
      'PXL',
    );
    const watermarkBuffer = await watermark.toBuffer();

    const extension = Utils.getExtension(temporaryPhoto.file.path);
    const watermarkFilePath = `/tmp/purepixel-local-storage/${temporaryPhoto.file.originalName}_watermark.${extension}`;

    writeFileSync(watermarkFilePath, watermarkBuffer);

    const photo = await this.photoRepository.create({
      photographer: {
        connect: {
          id: temporaryPhoto.photographerId,
        },
      },
      description: '',
      title: temporaryPhoto.file.originalName,
      normalizedTitle: Utils.normalizeText(temporaryPhoto.file.originalName),
      size: temporaryPhoto.file.size,
      exif: {},
      width: metadata.width,
      height: metadata.height,
      status: 'PENDING',
      photoType: 'BOOKING',
      blurHash: '',
      watermark: true,
      visibility: 'PRIVATE',
      originalPhotoUrl: temporaryPhoto.file.path,
      watermarkPhotoUrl: watermarkFilePath,
      booking: {
        connect: {
          id: booking.id,
        },
      },
    });

    this.logger.log(
      `create temporary watermark for photo id: ${photo.id} of booking id: ${booking.id}`,
    );

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: 'Gói chụp của bạn đã được cập nhật ảnh mới!',
      payload: photo,
      referenceType: 'BOOKING',
    });

    const key = `${photo.photographerId}/${photo.id}.${extension}`;
    await this.bunnyService.uploadFromBuffer(key, buffer);

    const watermarkKey = `watermark/${key}`;
    await this.bunnyService.uploadFromBuffer(watermarkKey, watermarkBuffer);

    const thumbnailBuffer = await this.photoProcessService.makeThumbnail(sharp);
    await this.bunnyService.uploadFromBuffer(
      `thumbnail/${photo.id}.webp`,
      thumbnailBuffer,
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
        data: watermarkFilePath,
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

    const buffer = await sharp.toBuffer();

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

    const watermark = await this.photoProcessService.makeWatermark(
      sharp,
      'PXL',
    );
    const watermarkBuffer = await watermark.toBuffer();
    const watermarkKey = `watermark/${key}`;
    await this.bunnyService.uploadFromBuffer(
      `watermark/${key}`,
      watermarkBuffer,
    );
    this.logger.log(`uploaded watermark for photo id: ${photo.id}`);

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
          await this.photoRepository.updateById(photo.id, {
            status: 'DUPLICATED',
            visibility: 'PRIVATE',
          });

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
