import { BadRequestException } from '@nestjs/common';

export class PhotoMinSizeIsNotExcessException extends BadRequestException {
  constructor() {
    super(PhotoMinSizeIsNotExcessException.name);
  }
}
