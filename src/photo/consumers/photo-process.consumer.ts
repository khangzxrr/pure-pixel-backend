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

    //when photo is not ready because pending state (photo not convert to jpg yet)
    //we should call convert
    //then continue to process safety
    if (photo.status == 'PENDING') {
      await this.photoProcessService.convertJpg(photo.originalPhotoUrl);
    }

    photo.watermarkPhotoUrl = await this.photoProcessService.watermark(
      photo.originalPhotoUrl,
      generateWatermarkRequest.text,
    );

    photo.watermarkThumbnailPhotoUrl = await this.photoProcessService.thumbnail(
      photo.watermarkPhotoUrl,
    );

    photo.watermark = true;

    await this.photoRepository.update(photo);
  }

  async processPhoto(
    userId: string,
    processPhotosRequest: ProcessPhotosRequest,
  ) {
    this.logger.log(`process photos`);
    this.logger.log(processPhotosRequest);

    await this.convertAndGenerateThumbnailExif(userId, processPhotosRequest);
    const photos = await this.getAllProcessedPhotos(
      userId,
      processPhotosRequest,
    );

    await this.photoGateway.sendFinishProcessPhotoEventToUserId(userId, photos);
  }

  async getAllProcessedPhotos(
    userId: string,
    processImagesRequest: ProcessPhotosRequest,
  ) {
    const getPhotoPromises = processImagesRequest.signedUploads.map(
      async (su) =>
        await this.photoService.getSignedPhotoById(userId, su.photoId),
    );

    return await Promise.all(getPhotoPromises);
  }

  async convertAndGenerateThumbnailExif(
    userId: string,
    processImagesRequest: ProcessPhotosRequest,
  ) {
    const photoIds = processImagesRequest.signedUploads.map((su) => su.photoId);

    const photos = await this.photoRepository.getPhotoByIdsAndStatus(
      photoIds,
      'PENDING',
      userId,
    );

    const updatePhotoPromises = photos.map(async (p) => {
      //convert to jpg to prevent watermark error
      await this.photoProcessService.convertJpg(p.originalPhotoUrl);

      const head = await this.photoProcessService.getSize(p.originalPhotoUrl);

      p.size = head.ContentLength;

      const thumbnailKey = await this.photoProcessService.thumbnail(
        p.originalPhotoUrl,
      );
      p.thumbnailPhotoUrl = thumbnailKey;

      // const watermarkThumbnailKey =
      //   await this.photoProcessService.watermark(thumbnailKey);
      // p.watermarkThumbnailPhotoUrl = watermarkThumbnailKey;
      //
      //we need not to create watermark thumbnail
      //they cannot use it anyway ;)
      p.watermarkThumbnailPhotoUrl = p.thumbnailPhotoUrl;

      //using original
      //only process watermark if user required
      p.watermarkPhotoUrl = p.originalPhotoUrl;

      //this is not optimized because we have to get original image from url
      //each time we call different process method
      //wasting bandwidth!
      //please fix this if we have time
      const exifs = await this.photoProcessService.parseExif(
        p.originalPhotoUrl,
      );
      p.exif = exifs;

      p.status = 'PARSED';

      return p;
    });

    const updatePhotos = await Promise.all(updatePhotoPromises);

    const initPhotoBytes = 0;
    const sumOfPhotoBytes = updatePhotos.reduce(
      (acc, current) => acc + current.size,
      initPhotoBytes,
    );

    const updateQueries = this.photoRepository.batchUpdate(updatePhotos);

    const updateQuotaQuery = this.userRepository.increasePhotoQuotaUsageById(
      userId,
      sumOfPhotoBytes,
    );

    await this.databaseService.applyTransactionMultipleQueries([
      ...updateQueries,
      updateQuotaQuery,
    ]);
  }
}
