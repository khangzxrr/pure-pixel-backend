import { BadRequestException } from '@nestjs/common';

export class CannotUpdateVisibilityPhotoHasActiveSellingException extends BadRequestException {
  constructor() {
    super(CannotUpdateVisibilityPhotoHasActiveSellingException.name);
  }
}
