import { BadRequestException } from '@nestjs/common';

export class PhotoSellNotFoundException extends BadRequestException {
  constructor() {
    super(PhotoSellNotFoundException.name);
  }
}
