import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FailedToGenerateThumbnailException } from '../exceptions/failed-to-generate-thumbnail.exception';

import exifr from 'exifr';
import * as SharpLib from 'sharp';
import { PhotoConstant } from '../constants/photo.constant';
import { BunnyService } from 'src/storage/services/bunny.service';
import * as phash from 'sharp-phash';
import * as dist from 'sharp-phash/distance';
import { decode, encode } from 'blurhash';
import { SignedUrl } from '../dtos/photo-signed-url.dto';

@Injectable()
export class PhotoProcessService {
  constructor(
    private readonly httpService: HttpService,
    @Inject() private readonly bunnyService: BunnyService,
  ) {}

  signPendingPhoto(id: string): SignedUrl {
    return {
      url: `${process.env.BACKEND_ORIGIN}/photo/${id}/temporary-photo`,
      thumbnail: `${process.env.BACKEND_ORIGIN}/photo/${id}/temporary-photo`,
    };
  }

  signPendingWatermarkPhoto(id: string): SignedUrl {
    return {
      url: `${process.env.BACKEND_ORIGIN}/photo/${id}/temporary-photo?watermark=true`,
      thumbnail: `${process.env.BACKEND_ORIGIN}/photo/${id}/temporary-photo?watermark=true`,
    };
  }

  signPhoto(url: string, id: string): SignedUrl {
    return {
      url: this.bunnyService.getPresignedFile(url),
      thumbnail: this.bunnyService.getPresignedFile(`thumbnail/${id}.webp`),
    };
  }

  signWatermarkPhoto(url: string, id: string): SignedUrl {
    return {
      url: this.bunnyService.getPresignedFile(url),
      thumbnail: this.bunnyService.getPresignedFile(
        `thumbnail/watermark/${id}.webp`,
      ),
    };
  }

  isExistHash(target: string, compares: string[], threshold = 5) {
    for (let compare of compares) {
      const d = dist(target, compare);
      if (d < threshold) {
        return true;
      }
    }

    return false;
  }

  async getHashFromBuffer(buffer: Buffer) {
    return await phash(buffer);
  }

  async getHashFromKey(key: string) {
    const buffer = await this.getBufferFromKey(key);

    return await this.getHashFromBuffer(buffer);
  }

  async uploadFromBuffer(key: string, buffer: Buffer) {
    return this.bunnyService.uploadFromBuffer(key, buffer);
  }

  async sharpInitFromBuffer(buffer: Buffer) {
    return SharpLib(buffer);
  }

  async sharpInitFromFilePath(url: string) {
    //ignore fail on error to process some pixel error photos
    return SharpLib(url, { failOnError: false });
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

  async thumbnailFromBuffer(buffer: Buffer) {
    const sharp = await this.sharpInitFromBuffer(buffer);

    return this.makeThumbnail(sharp);
  }
  async makeThumbnail(sharp: SharpLib.Sharp) {
    return sharp
      .clone()
      .withMetadata({
        exif: {},
      })
      .resize(PhotoConstant.THUMBNAIL_WIDTH)
      .webp({
        quality: 50,
      })
      .toBuffer();
  }

  async makeTextWatermark(buffer: Buffer, text: string) {
    const sharp = await this.sharpInitFromBuffer(buffer);

    const watermarkPhoto = await this.makeWatermark(sharp, text);

    return watermarkPhoto.toBuffer();
  }

  async makeWatermark(sharp: SharpLib.Sharp, watermarkText: string) {
    const metadata = await sharp.metadata();

    let width = metadata.width;
    let height = metadata.height;
    if (metadata.orientation >= 5) {
      width = height;
      height = width;
    }

    const fontSizeScaledByWidth = (width * 10) / 100;

    const svg = `<svg height="${height}" width="${width}"> 
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

  async bufferToBlurhash(buffer: Buffer): Promise<string> {
    const sharp = await this.sharpInitFromBuffer(buffer);

    const resize = sharp
      .raw({})
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' });

    return new Promise((resolve, reject) => {
      resize.toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err);

        console.log(buffer);
        console.log(width, height);

        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
      });
    });
  }

  async parseMetadataFromFilePath(url: string) {
    const sharp = await this.sharpInitFromFilePath(url);

    return sharp.metadata();
  }

  async parseExifFromFilePath(url: string): Promise<object> {
    return exifr.parse(url, {
      exif: true,
      xmp: false,
    });
  }

  async parseExifFromBuffer(buffer: Buffer): Promise<object> {
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
