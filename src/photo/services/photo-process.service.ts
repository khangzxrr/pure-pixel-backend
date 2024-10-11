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

  async deleteKeys(keys: string[]) {
    return await this.storageService.deleteKeys(keys);
  }

  async getPresignUploadUrl(key: string) {
    return this.storageService.getPresignedUploadUrl(key, 'private');
  }

  async sharpInitFromBuffer(buffer: Buffer) {
    return SharpLib(buffer);
  }

  async sharpInitFromObjectKey(key: string) {
    const buffer = await this.getObjectToBuffer(key);

    const photo = SharpLib(buffer);
    return photo;
  }

  async getAvailableResolution(key: string): Promise<string[]> {
    const sharp = await this.sharpInitFromObjectKey(key);

    const metadata = await sharp.metadata();

    const availableRes = [...PhotoConstant.SUPPORTED_PHOTO_RESOLUTION];

    for (let i = 0; i < PhotoConstant.SUPPORTED_PHOTO_RESOLUTION.length; i++) {
      const pixelOfRes = PhotoConstant.PHOTO_RESOLUTION_BIMAP.getValue(
        PhotoConstant.SUPPORTED_PHOTO_RESOLUTION[i],
      );

      if (metadata.height >= pixelOfRes) {
        break;
      }

      availableRes.shift();
    }

    return availableRes;
  }

  async resizeWithMetadata(sharp: SharpLib.Sharp, heightRequired: number) {
    return sharp
      .clone()
      .withMetadata()
      .resize({
        height: heightRequired,
      })
      .toBuffer();
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

  async makeTextWatermark(buffer: Buffer, text: string) {
    const sharp = await this.sharpInitFromBuffer(buffer);

    const watermarkPhoto = await this.makeWatermark(sharp, text);

    return watermarkPhoto.toBuffer();
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
    return sharp.clone().jpeg({
      quality: 100,
    });
  }

  async parseXmpFromBuffer(buffer: Buffer) {
    return exifr.parse(buffer, {
      exif: false,
      xmp: true,
    });
  }

  async parseExifFromBuffer(buffer: Buffer) {
    return exifr.parse(buffer, {
      exif: true,
      xmp: false,
    });
  }

  async makeExif(sharp: SharpLib.Sharp) {
    return exifr.parse(await sharp.keepExif().toBuffer(), {
      exif: true,
    });
  }

  async getEncodedSignedGetObjectUrl(originalImageKey: string) {
    const imagePublicUrl =
      await this.storageService.signUrlUsingCDN(originalImageKey);

    const encodedImageUrl = encodeURIComponent(imagePublicUrl);

    return encodedImageUrl;
  }

  async getSignedObjectUrl(key: string) {
    return this.storageService.signUrlUsingCDN(key);
  }

  async getObjectToBuffer(key: string): Promise<Buffer> {
    const byteArray = await this.storageService.getObjectToByteArray(key);

    return Buffer.from(byteArray);
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
