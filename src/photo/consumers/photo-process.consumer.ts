import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { PhotoService } from '../services/photo.service';
import { ProcessPhotosRequest } from '../dtos/process-images.request.dto';
import { DatabaseService } from 'src/database/database.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Sharp } from 'sharp';
import { Photo } from '../entities/photo.entity';
import { ShareStatus } from '@prisma/client';
import { PhotoProcessDto } from '../dtos/photo-process.dto';

@Processor(PhotoConstant.PHOTO_PROCESS_QUEUE)
export class PhotoProcessConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoProcessConsumer.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
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
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  async generateSharePayload(sharp: Sharp, photo: Photo) {
    const availableResolutions =
      await this.photoProcessService.getAvailableResolution(
        photo.originalPhotoUrl,
      );

    const sharePayload = {};

    for (const r of availableResolutions) {
      const buffer = await this.photoProcessService.resize(sharp, r.pixels);

      const key = `${r.resolution}/${photo.originalPhotoUrl}`;
      sharePayload[r.resolution] = key;

      await this.photoProcessService.uploadFromBuffer(key, buffer);
    }

    photo.shareStatus = ShareStatus.READY;
    photo.sharePayload = sharePayload;

    const updatedPhoto = await this.photoRepository.updatePhotoShare(photo);

    await this.photoGateway.sendFinishWatermarkEventToUserId(
      photo.photographerId,
      updatedPhoto,
    );

    await this.photoGateway.sendDataToUserId(
      photo.photographerId,
      'generated-multiple-share-resolutions',
      updatedPhoto,
    );
  }

  async processPhoto(userId: string, processRequest: ProcessPhotosRequest) {
    this.logger.log(`process photos`);
    this.logger.log(processRequest);

    await this.convertAndEmitProcessEvents(userId, processRequest);
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

    const thumbnailBuffer = await this.photoProcessService
      .makeThumbnail(sharp)
      .then((s) => s.toBuffer());
    photo.thumbnailPhotoUrl = `thumbnail/${photo.originalPhotoUrl}`;
    await this.photoProcessService.uploadFromBuffer(
      photo.thumbnailPhotoUrl,
      thumbnailBuffer,
    );

    photo.watermarkThumbnailPhotoUrl = photo.thumbnailPhotoUrl;

    photo.watermarkPhotoUrl = photo.originalPhotoUrl;
    photo.status = 'PARSED';

    const photoProcess = new PhotoProcessDto(
      photo.id,
      photo.originalPhotoUrl,
      photo.thumbnailPhotoUrl,
      photo.watermarkPhotoUrl,
      photo.watermarkThumbnailPhotoUrl,
      photo.status,
      photo.size,
    );

    const updateQueries = this.photoRepository.batchUpdatePhotoProcess([
      photoProcess,
    ]);
    const updateQuotaQuery = this.userRepository.increasePhotoQuotaUsageById(
      userId,
      photo.size,
    );

    await this.databaseService.applyTransactionMultipleQueries([
      ...updateQueries,
      updateQuotaQuery,
    ]);

    await this.photoGateway.sendFinishProcessPhotoEventToUserId(userId, photo);
  }
}
