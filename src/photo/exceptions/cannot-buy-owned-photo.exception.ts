import { BadRequestException } from '@nestjs/common';

export class CannotBuyOwnedPhotoException extends BadRequestException {
  constructor() {
    super(CannotBuyOwnedPhotoException.name);
  }
}
