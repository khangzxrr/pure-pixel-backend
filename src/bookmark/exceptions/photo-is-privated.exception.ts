import { BadRequestException } from '@nestjs/common';

export class PhotoIsPrivateException extends BadRequestException {
  constructor() {
    super(PhotoIsPrivateException);
  }
}
