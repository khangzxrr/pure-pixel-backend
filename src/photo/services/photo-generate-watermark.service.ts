import { Inject, Injectable, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { PhotoProcessService } from './photo-process.service';

@Injectable()
export class PhotoGenerateWatermarkService {
  private readonly logger = new Logger(PhotoGenerateWatermarkService.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

  async processWatermark(
    userId: string,
    generateWatermarkRequest: GenerateWatermarkRequestDto,
    buffer: Buffer,
  ) {
    this.logger.log(`generate watermark`);
    this.logger.log(generateWatermarkRequest);

    const photo = await this.generateWatermark(
      generateWatermarkRequest,
      buffer,
    );

    await this.photoGateway.sendFinishWatermarkEventToUserId(userId, photo);
  }

  async generateWatermark(
    generateWatermarkRequest: GenerateWatermarkRequestDto,
    buffer: Buffer,
  ) {
    const photo = await this.photoRepository.getPhotoById(
      generateWatermarkRequest.photoId,
    );

    const flagTime1 = new Date();

    const sharp = await this.photoProcessService.sharpInitFromBuffer(buffer);

    const watermark = await this.photoProcessService.makeWatermark(
      sharp,
      generateWatermarkRequest.text,
    );

    const flagTime2 = new Date();

    console.log(
      `time diff of watermark: ${flagTime2.valueOf() - flagTime1.valueOf()}`,
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
    photo.watermarkThumbnailPhotoUrl = `watermark/thumbnail/${photo.originalPhotoUrl}`;
    await this.photoProcessService.uploadFromBuffer(
      photo.watermarkThumbnailPhotoUrl,
      watermarkThumbnailBuffer,
    );

    await this.photoRepository.updateById(photo.id, {
      watermarkPhotoUrl: photo.watermarkPhotoUrl,
      watermarkThumbnailPhotoUrl: photo.watermarkThumbnailPhotoUrl,
    });

    this.logger.log(
      `created watermark: ${photo.watermarkPhotoUrl}\n${photo.watermarkThumbnailPhotoUrl}`,
    );

    return photo;
  }
}
