import { Inject, Injectable } from '@nestjs/common';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { TemporaryfileConstant } from '../constants/temporary-file.constant';
import { PhotoNotFoundException } from 'src/photo/exceptions/photo-not-found.exception';

@Injectable()
export class TemporaryfileService {
  constructor(
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

  async pathToBuffer(filename: string) {
    try {
      const sharp = await this.photoProcessService.sharpInitFromFilePath(
        `${TemporaryfileConstant.TEMP_DIRECTORY}/${filename}`,
      );

      return await sharp.toBuffer();
    } catch (e) {
      if (e.message.includes(`Input file is missing`)) {
        throw new PhotoNotFoundException();
      }
    }
  }
}
