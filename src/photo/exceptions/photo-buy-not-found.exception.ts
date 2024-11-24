import { BadRequestException } from '@nestjs/common';

export class PhotoBuyNotFoundException extends BadRequestException {
  constructor() {
    super(PhotoBuyNotFoundException.name);
  }
}
