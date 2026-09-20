import { Inject, Injectable } from '@nestjs/common';
import { PhotoProcessService } from './photo-process.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';

@Injectable()
export class PhotoValidateService {
  constructor(
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoRepository: PhotoRepository,
  ) {}

  async validateHash(buffer: Buffer) {
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
  }
}
