import { HttpException } from '@nestjs/common';

export class FailedToGenerateThumbnailException extends HttpException {
  constructor() {
    super(FailedToGenerateThumbnailException.name, 500);
  }
}
