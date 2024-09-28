import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { StorageService } from 'src/storage/services/storage.service';
import { FailedToGenerateThumbnailException } from '../exceptions/failed-to-generate-thumbnail.exception';

import exifr from 'exifr';
import * as SharpLib from 'sharp';
import { PhotoConstant } from '../constants/photo.constant';

@Injectable()
export class PhotoProcessService {
  private readonly logger = new Logger(PhotoProcessService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject() private readonly storageService: StorageService,
  ) {}

  async getPresignUploadUrl(key: string) {
    return this.storageService.getPresignedUploadUrl(key);
  }

  async sharpInitFromBuffer(buffer: Buffer) {
    return SharpLib(buffer);
  }

  async sharpInitFromObjectKey(key: string) {
    const signedGetUrl = await this.storageService.getSignedGetUrl(key);

    const buffer = await this.getBufferImageFromUrl(signedGetUrl);
    const photo = SharpLib(buffer);

    return photo;
  }

  async getAvailableResolution(key: string) {
    const sharp = await this.sharpInitFromObjectKey(key);

    const metadata = await sharp.metadata();

    const availableRes = [...PhotoConstant.PHOTO_RESOLUTION_MAP];

    for (let i = 0; i < PhotoConstant.PHOTO_RESOLUTION_MAP.length; i++) {
      if (metadata.height >= PhotoConstant.PHOTO_RESOLUTION_MAP[i].pixels) {
        break;
      }

      availableRes.shift();
    }

    return availableRes;
  }

  async resize(sharp: SharpLib.Sharp, heightRequired: number) {
    //this resize will take orientation from exif
    //to determine resize width or height
    //caution this is a feature not a bug!
    return sharp
      .clone()
      .resize({
        height: heightRequired,
      })
      .toBuffer();
  }

  async makeThumbnail(sharp: SharpLib.Sharp) {
    return sharp.clone().resize(PhotoConstant.THUMBNAIL_WIDTH);
  }

  async makeWatermark(sharp: SharpLib.Sharp, watermarkText: string) {
    const metadata = await sharp.metadata();

    const fontSizeScaledByWidth = (metadata.width * 10) / 100;

    const svg = `<svg height="${metadata.height}" width="${metadata.width}"> 
        <text x="0%" y="10%" dominant-baseline="hanging" text-anchor="start" font-family="Roboto"  font-size="${fontSizeScaledByWidth}"  fill="#fff" fill-opacity="0.7">${watermarkText}</text> 
<text x="100%" y="10%" dominant-baseline="hanging" text-anchor="end" font-family="Roboto"  font-size="${fontSizeScaledByWidth}"  fill="#fff" fill-opacity="0.7">${watermarkText}</text> 

        <text x="0%" y="100%" dominant-baseline="middle" text-anchor="start" font-family="Roboto"  font-size="${fontSizeScaledByWidth}"  fill="#fff" fill-opacity="0.7">${watermarkText}</text> 

 
        <text x="100%" y="100%" dominant-baseline="middle" text-anchor="end" font-family="Roboto"  font-size="${fontSizeScaledByWidth}"  fill="#fff" fill-opacity="0.7">${watermarkText}</text> 

        <text x="50%" y="50%" font-family="Roboto" dominant-baseline="middle" text-anchor="middle" font-size="${fontSizeScaledByWidth}"  fill="#fff" fill-opacity="0.7">${watermarkText}</text>         
</svg>`;

    return sharp.clone().composite([
      {
        input: Buffer.from(svg),
      },
    ]);
  }

  async convertJpeg(sharp: SharpLib.Sharp) {
    return sharp.keepExif().clone().jpeg();
  }

  async makeExif(sharp: SharpLib.Sharp) {
    return exifr.parse(await sharp.keepExif().toBuffer(), {
      exif: true,
    });
  }

  async getEncodedSignedGetObjectUrl(originalImageKey: string) {
    const imagePublicUrl =
      await this.storageService.getSignedGetUrl(originalImageKey);

    const encodedImageUrl = encodeURIComponent(imagePublicUrl);

    return encodedImageUrl;
  }

  async getSignedObjectUrl(key: string) {
    return this.storageService.getSignedGetUrl(key);
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

  async uploadFromBuffer(key: string, buffer: Buffer) {
    await this.storageService.uploadFromBytes(key, buffer);
  }
}
