import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { StorageService } from 'src/storage/services/storage.service';
import { FailedToGenerateThumbnailException } from '../exceptions/failed-to-generate-thumbnail.exception';

import exifr from 'exifr';

@Injectable()
export class PhotoProcessService {
  private readonly logger = new Logger(PhotoProcessService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject() private readonly storageService: StorageService,
  ) {}

  async getEncodedSignedGetObjectUrl(originalImageKey: string) {
    const imagePublicUrl =
      await this.storageService.getSignedGetUrl(originalImageKey);

    const encodedImageUrl = encodeURIComponent(imagePublicUrl);

    return encodedImageUrl;
  }

  async getBufferImageFromUrl(url: string) {
    const response = await lastValueFrom(
      this.httpService.get(url, {
        responseType: 'arraybuffer',
      }),
    );

    if (response.status != 200) {
      throw new FailedToGenerateThumbnailException();
    }

    return response.data;
  }

  async parseExif(originalImageKey: string) {
    const imagePublicUrl =
      await this.storageService.getSignedGetUrl(originalImageKey);

    const exifs = await exifr.parse(imagePublicUrl);

    return exifs;
  }

  async getSize(key: string) {
    return this.storageService.getObjectHead(key);
  }

  async convertJpg(photoKey: string) {
    const encodedImageUrl = await this.getEncodedSignedGetObjectUrl(photoKey);

    const buffers = await this.getBufferImageFromUrl(
      `${process.env.IMAGINARY_ENDPOINT}/convert?type=jpeg&stripmeta=true&quality=100&url=${encodedImageUrl}`,
    );

    await this.storageService.uploadFromBytes(photoKey, buffers);
  }

  async watermark(originalImageKey: string, text: string) {
    const encodedImageUrl =
      await this.getEncodedSignedGetObjectUrl(originalImageKey);

    const color = '255,255,255';
    const font = 'sans bold 40';
    const opacity = '0.7';

    const buffers = await this.getBufferImageFromUrl(
      `${process.env.IMAGINARY_ENDPOINT}/watermark?&text=${text}&color=${color}&font=${font}&opacity=${opacity}&url=${encodedImageUrl}`,
    );

    const watermarkImageKey = `watermark/${originalImageKey}`;

    await this.storageService.uploadFromBytes(watermarkImageKey, buffers);

    this.logger.log(`created watermark for key ${originalImageKey}`);

    return watermarkImageKey;
  }

  async thumbnail(originalImageKey: string) {
    const encodedImageUrl =
      await this.getEncodedSignedGetObjectUrl(originalImageKey);

    const width = '400';

    this.logger.debug(`get image from ${encodedImageUrl}`);
    const buffers = await this.getBufferImageFromUrl(
      `${process.env.IMAGINARY_ENDPOINT}/thumbnail?width=${width}&url=${encodedImageUrl}`,
    );

    const thumbnailKey = `thumbnail/${originalImageKey}`;

    this.logger.debug(`upload image `);

    await this.storageService.uploadFromBytes(thumbnailKey, buffers);

    this.logger.log(`created thumbnail for key ${originalImageKey}`);

    return thumbnailKey;
  }
}
