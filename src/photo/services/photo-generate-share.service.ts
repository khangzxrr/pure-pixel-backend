import { Inject, Injectable, Logger } from '@nestjs/common';
import { ShareStatus } from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoConstant } from '../constants/photo.constant';
import { PhotoGateway } from '../gateways/socket.io.gateway';
import { PhotoProcessService } from './photo-process.service';

@Injectable()
export class PhotoGenerateShareService {
  private readonly logger = new Logger(PhotoGenerateShareService.name);

  constructor(
    @Inject() private readonly photoGateway: PhotoGateway,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

  async generateSharePayload(photoId: string, buffer: Buffer) {
    this.logger.log(`generate share payload for photo ${photoId}`);

    const photo = await this.photoRepository.getPhotoById(photoId);

    const sharp = await this.photoProcessService.sharpInitFromBuffer(buffer);

    const availableResolutions =
      await this.photoProcessService.getAvailableResolution(
        photo.originalPhotoUrl,
      );

    const sharePayload = {};

    for (const res of availableResolutions) {
      const buffer = await this.photoProcessService.resize(
        sharp,
        PhotoConstant.PHOTO_RESOLUTION_BIMAP[res],
      );

      const key = `${res}/${photo.originalPhotoUrl}`;
      sharePayload[res] = key;

      await this.photoProcessService.uploadFromBuffer(key, buffer);
    }

    photo.shareStatus = ShareStatus.READY;
    photo.sharePayload = sharePayload;

    await this.photoRepository.updateById(photo.id, {
      shareStatus: 'READY',
      sharePayload,
    });

    await this.photoGateway.sendDataToUserId(
      photo.photographerId,
      'generated-multiple-share-resolutions',
      photo,
    );
  }
}
