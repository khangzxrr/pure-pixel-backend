import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Job } from 'bullmq';
import { ProcessImagesRequest } from '../dtos/process-images.request.dto';
import { Inject, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoProcessService } from '../services/photo-process.service';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { PhotoService } from '../services/photo.service';

@Processor(PhotoConstant.PHOTO_PROCESS_QUEUE)
export class PhotoProcessConsumer extends WorkerHost {
  private readonly logger = new Logger(PhotoProcessConsumer.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoService: PhotoService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      console.log(`consume job`);
      await this.processImages(job.data.userId, job.data.processImagesRequest);
      const photos = await this.getAllProcessedPhotos(
        job.data.userId,
        job.data.processImagesRequest,
      );

      await this.photoGateway.sendToUserId(job.data.userId, photos);
    } catch (e) {
      this.logger.error(e);
      throw new Error(); //perform retry
    }
  }

  async getAllProcessedPhotos(
    userId: string,
    processImagesRequest: ProcessImagesRequest,
  ) {
    const getPhotoPromises = processImagesRequest.signedUploads.map(
      async (su) => await this.photoService.getPhotoById(userId, su.photoId),
    );

    return await Promise.all(getPhotoPromises);
  }

  async processImages(
    userId: string,
    processImagesRequest: ProcessImagesRequest,
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

      const watermarkImageKey = await this.photoProcessService.watermark(
        p.originalPhotoUrl,
      );
      p.watermarkPhotoUrl = watermarkImageKey;

      //this is not optimized because we have to get original image from url
      //each time we call different process method
      //wasting bandwidth!
      //please fix this if we have time
      const exifs = await this.photoProcessService.parseExif(
        p.originalPhotoUrl,
      );
      p.exif = exifs;

      p.status = 'PARSED';

      this.logger.log(`generated watermark image: ${watermarkImageKey}`);

      return p;
    });

    const updatePhotos = await Promise.all(updatePhotoPromises);
    await this.photoRepository.batchUpdate(updatePhotos);

    this.logger.log(`finish process photos`);
  }
}
