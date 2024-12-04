import { Inject, Injectable } from '@nestjs/common';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { TemporaryfileConstant } from '../constants/temporary-file.constant';
import { PhotoNotFoundException } from 'src/photo/exceptions/photo-not-found.exception';
import { PathNotValidException } from '../exceptions/path-not-valid.exception';

@Injectable()
export class TemporaryfileService {
  constructor(
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

  signFilesystemPath(path: string) {
    if (path.indexOf(TemporaryfileConstant.TEMP_DIRECTORY) < 0) {
      path = `${TemporaryfileConstant.TEMP_DIRECTORY}/${path}`;
    }

    return `${process.env.BACKEND_ORIGIN}/temporary-file?path=${encodeURIComponent(path)}`;
  }

  async pathToBuffer(path: string) {
    if (path.indexOf(TemporaryfileConstant.TEMP_DIRECTORY) < 0) {
      throw new PathNotValidException();
    }

    try {
      const sharp = await this.photoProcessService.sharpInitFromFilePath(path);

      return await sharp.toBuffer();
    } catch (e) {
      if (e.message.includes(`Input file is missing`)) {
        throw new PhotoNotFoundException();
      }
    }
  }
}
