import { Inject, Injectable, Logger } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { PhotoGateway } from '../gateways/photo.gateway';
import { PhotoProcessService } from './photo-process.service';

@Injectable()
export class PhotoGenerateWatermarkService {
  private readonly logger = new Logger(PhotoGenerateWatermarkService.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

  async generateWatermark(
    id: string,
    generateWatermarkRequest: GenerateWatermarkRequestDto,
  ) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    const flagTime1 = new Date();

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photo.originalPhotoUrl,
    );

    const watermark = await this.photoProcessService.makeWatermark(
      sharp,
      generateWatermarkRequest.text,
    );

    const flagTime2 = new Date();

    console.log(
      `time diff of watermark: ${flagTime2.valueOf() - flagTime1.valueOf()}`,
    );

    const watermarkBuffer = await watermark.keepMetadata().toBuffer();

    photo.watermarkPhotoUrl = `watermark/${photo.originalPhotoUrl}`;
    await this.photoProcessService.uploadFromBuffer(
      photo.watermarkPhotoUrl,
      watermarkBuffer,
    );

    await this.photoRepository.updateById(photo.id, {
      watermarkPhotoUrl: photo.watermarkPhotoUrl,
    });

    this.logger.log(`created watermark: ${photo.watermarkPhotoUrl}`);

    return photo;
  }
}
