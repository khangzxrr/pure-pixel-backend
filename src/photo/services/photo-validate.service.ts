import { Inject, Injectable } from '@nestjs/common';
import { TineyeService } from 'src/storage/services/tineye.service';
import { PhotoProcessService } from './photo-process.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { PhotoConstant } from '../constants/photo.constant';

@Injectable()
export class PhotoValidateService {
  constructor(
    @Inject() private readonly tineyeService: TineyeService,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoRepository: PhotoRepository,
  ) {}

  async validateHashAndMatching(buffer: Buffer, filename: string) {
    const hash = await this.photoProcessService.getHashFromBuffer(buffer);

    const allPreviousHashs = await this.photoRepository.findAllHash();

    const compareHashs = allPreviousHashs.map((h) => h.hash);
    const sameHashPhoto = this.photoProcessService.isExistHash(
      hash,
      compareHashs,
    );

    if (sameHashPhoto) {
      throw new FailToPerformOnDuplicatedPhotoException();
    }

    const sharp = await this.photoProcessService.sharpInitFromBuffer(buffer);
    const resizeBuffer = await this.photoProcessService.resize(
      sharp,
      PhotoConstant.TINEYE_MIN_PHOTO_WIDTH,
    );

    const response = await this.tineyeService.searchByBuffer(
      resizeBuffer,
      filename,
    );
    const result = response.data.result;

    if (result) {
      if (result.length > 0 && result[0].match_percent >= 40) {
        throw new FailToPerformOnDuplicatedPhotoException();
      }
    }
  }
}
