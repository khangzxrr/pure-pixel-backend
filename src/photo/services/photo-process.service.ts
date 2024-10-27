import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FailedToGenerateThumbnailException } from '../exceptions/failed-to-generate-thumbnail.exception';

import exifr from 'exifr';
import * as SharpLib from 'sharp';
import { PhotoConstant } from '../constants/photo.constant';
import { BunnyService } from 'src/storage/services/bunny.service';

@Injectable()
export class PhotoProcessService {
  private readonly logger = new Logger(PhotoProcessService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject() private readonly bunnyService: BunnyService,
  ) {}

  async uploadFromBuffer(key: string, buffer: Buffer) {
    return this.bunnyService.uploadFromBuffer(key, buffer);
  }

  async sharpInitFromBuffer(buffer: Buffer) {
    return SharpLib(buffer);
  }

  async sharpInitFromObjectKey(key: string) {
    const buffer = await this.bunnyService.download(key);

    const photo = SharpLib(buffer);
    return photo;
  }

  async resizeWithMetadata(sharp: SharpLib.Sharp, widthRequired: number) {
    return sharp
      .clone()
      .withMetadata()
      .resize({
        width: widthRequired,
      })
      .toBuffer();
  }

  async resize(sharp: SharpLib.Sharp, widthRequired: number) {
    //this resize will take orientation from exif
    //to determine resize width or height
    //caution this is a feature not a bug!
    return sharp
      .clone()
      .resize({
        width: widthRequired,
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

  async parseMetadataFromBuffer(buffer: Buffer) {
    const sharp = await this.sharpInitFromBuffer(buffer);

    return sharp.metadata();
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

  async getBufferFromKey(key: string) {
    return await this.bunnyService.download(key);
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
}
