import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { StorageService } from 'src/storage/services/storage.service';
import { FailedToGenerateThumbnailException } from '../exceptions/failed-to-generate-thumbnail.exception';
import { FailedToUploadFileException } from '../exceptions/failed-to-upload-file.exception';

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

  async watermark(originalImageKey: string) {
    const encodedImageUrl =
      await this.getEncodedSignedGetObjectUrl(originalImageKey);

    const response = await lastValueFrom(
      this.httpService.get(
        `${process.env.IMAGINARY_ENDPOINT}/watermark?text=purepixel&textwidth=120&url=${encodedImageUrl}`,
        {
          responseType: 'arraybuffer',
        },
      ),
    );

    if (response.status != 200) {
      throw new FailedToGenerateThumbnailException();
    }

    const watermarkImageBytes = response.data;
    const watermarkImageKey = `watermark/${originalImageKey}`;

    const uploadResult = await this.storageService.uploadFromBytes(
      watermarkImageKey,
      watermarkImageBytes,
    );

    if (uploadResult.$metadata.httpStatusCode != 200) {
      throw new FailedToUploadFileException();
    }

    this.logger.log(`created watermark for key ${originalImageKey}`);

    return watermarkImageKey;
  }

  async thumbnail(originalImageKey: string) {
    const encodedImageUrl =
      await this.getEncodedSignedGetObjectUrl(originalImageKey);

    const width = '400';
    const response = await lastValueFrom(
      this.httpService.get(
        `${process.env.IMAGINARY_ENDPOINT}/thumbnail?width=${width}&url=${encodedImageUrl}`,
        {
          responseType: 'arraybuffer',
        },
      ),
    );

    if (response.status != 200) {
      throw new FailedToGenerateThumbnailException();
    }

    const thumbnailImageBytes = response.data;
    const thumbnailKey = `thumbnail/${originalImageKey}`;

    const uploadResult = await this.storageService.uploadFromBytes(
      thumbnailKey,
      thumbnailImageBytes,
    );

    if (uploadResult.$metadata.httpStatusCode != 200) {
      throw new FailedToUploadFileException();
    }

    this.logger.log(`created thumbnail for key ${originalImageKey}`);

    return thumbnailKey;
  }
}
