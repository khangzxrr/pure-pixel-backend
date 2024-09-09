import { BadRequestException } from '@nestjs/common';

export class PhotoIsPendingStateException extends BadRequestException {
  constructor() {
    super(PhotoIsPendingStateException.name);
  }
}
