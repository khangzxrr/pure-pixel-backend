import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { DatabaseService } from 'src/database/database.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoConstant } from '../constants/photo.constant';
import { GenerateWatermarkRequestDto } from '../dtos/generate-watermark.request.dto';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoService } from '../services/photo.service';

@Processor(PhotoConstant.PHOTO_WATERMARK_QUEUE)
export class PhotoWatermarkConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoWatermarkConsumer.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly databaseService: DatabaseService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case PhotoConstant.GENERATE_WATERMARK_JOB:
          await this.processWatermark(
            job.data.userId,
            job.data.generateWatermarkRequest,
          );
          break;
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  async processWatermark(
    userId: string,
    generateWatermarkRequest: GenerateWatermarkRequestDto,
  ) {
    this.logger.log(`generate watermark`);
    this.logger.log(generateWatermarkRequest);

    await this.generateWatermark(generateWatermarkRequest);

    const photo = await this.photoService.getSignedPhotoById(
      userId,
      generateWatermarkRequest.photoId,
    );

    await this.photoGateway.sendFinishWatermarkEventToUserId(userId, photo);
  }

  async generateWatermark(
    generateWatermarkRequest: GenerateWatermarkRequestDto,
  ) {
    const photo = await this.photoRepository.getPhotoById(
      generateWatermarkRequest.photoId,
    );

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photo.originalPhotoUrl,
    );

    const watermark = await this.photoProcessService.makeWatermark(
      sharp,
      generateWatermarkRequest.text,
    );

    const watermarkBuffer = await watermark.toBuffer();
    photo.watermarkPhotoUrl = `watermark/${photo.originalPhotoUrl}`;
    await this.photoProcessService.uploadFromBuffer(
      photo.watermarkPhotoUrl,
      watermarkBuffer,
    );

    //make a copy from buffer DO NOT DIRECT USE watermark: sharp
    //or it will throw composite image not valid size
    const watermarkFromBuffer =
      await this.photoProcessService.sharpInitFromBuffer(watermarkBuffer);
    const watermarkThumbnail =
      await this.photoProcessService.makeThumbnail(watermarkFromBuffer);

    const watermarkThumbnailBuffer = await watermarkThumbnail.toBuffer();
    photo.watermarkThumbnailPhotoUrl = `thumbnail/${photo.originalPhotoUrl}`;
    await this.photoProcessService.uploadFromBuffer(
      photo.watermarkThumbnailPhotoUrl,
      watermarkThumbnailBuffer,
    );

    await this.photoRepository.update(photo);
  }
}
