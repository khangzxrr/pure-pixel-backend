import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { PhotoService } from '../services/photo.service';
import { GenerateWatermarkRequestDto } from '../dtos/generate-watermark.request.dto';
import { ProcessPhotosRequest } from '../dtos/process-images.request.dto';
import { DatabaseService } from 'src/database/database.service';
import { UserRepository } from 'src/database/repositories/user.repository';

@Processor(PhotoConstant.PHOTO_PROCESS_QUEUE)
export class PhotoProcessConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoProcessConsumer.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly databaseService: DatabaseService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case PhotoConstant.PROCESS_PHOTO_JOB_NAME:
          await this.processPhoto(
            job.data.userId,
            job.data.processPhotosRequest,
          );
          break;
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
      photo.id,
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

    const watermarkThumbnail =
      await this.photoProcessService.makeThumbnail(watermark);

    const watermarkThumbnailBuffer = await watermarkThumbnail.toBuffer();
    photo.watermarkThumbnailPhotoUrl = `thumbnail/${photo.originalPhotoUrl}`;
    await this.photoProcessService.uploadFromBuffer(
      photo.watermarkThumbnailPhotoUrl,
      watermarkThumbnailBuffer,
    );

    await this.photoRepository.update(photo);
  }

  async processPhoto(userId: string, processRequest: ProcessPhotosRequest) {
    this.logger.log(`process photos`);
    this.logger.log(processRequest);

    await this.convertAndEmitProcessEvents(userId, processRequest);

    const photo = await this.photoService.getSignedPhotoById(
      userId,
      processRequest.signedUpload.photoId,
    );

    await this.photoGateway.sendFinishProcessPhotoEventToUserId(userId, photo);
  }

  async convertAndEmitProcessEvents(
    userId: string,
    processImagesRequest: ProcessPhotosRequest,
  ) {
    const photo = await this.photoRepository.getPhotoByIdAndStatusAndUserId(
      processImagesRequest.signedUpload.photoId,
      'PENDING',
      userId,
    );

    if (!photo) {
      this.logger.error(
        `photo not found to process userId: ${userId}, photoId: ${processImagesRequest.signedUpload.photoId}`,
      );

      return;
    }

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photo.originalPhotoUrl,
    );

    const sharpJpegBuffer = await this.photoProcessService
      .convertJpeg(sharp)
      .then((s) => s.toBuffer());
    await this.photoProcessService.uploadFromBuffer(
      photo.originalPhotoUrl,
      sharpJpegBuffer,
    );

    const metadata = await sharp.metadata();
    photo.size = metadata.size;
    photo.exif = await this.photoProcessService.makeExif(sharp);

    photo.thumbnailPhotoUrl = photo.originalPhotoUrl;
    photo.watermarkThumbnailPhotoUrl = photo.originalPhotoUrl;
    photo.watermarkPhotoUrl = photo.originalPhotoUrl;
    photo.status = 'PARSED';

    const updateQueries = this.photoRepository.batchUpdate([photo]);
    const updateQuotaQuery = this.userRepository.increasePhotoQuotaUsageById(
      userId,
      photo.size,
    );

    await this.databaseService.applyTransactionMultipleQueries([
      ...updateQueries,
      updateQuotaQuery,
    ]);
  }
}
