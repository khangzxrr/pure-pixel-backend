import { BadRequestException } from '@nestjs/common';

export class ExistPhotoBuyWithChoosedResolutionException extends BadRequestException {
  constructor() {
    super(ExistPhotoBuyWithChoosedResolutionException.name);
  }
}
