import { BadRequestException } from '@nestjs/common';

export class CannotUpdateWatermarkPhotoHasActiveSellingException extends BadRequestException {
  constructor() {
    super(CannotUpdateWatermarkPhotoHasActiveSellingException.name);
  }
}
