import { BadRequestException } from '@nestjs/common';

export class NotBelongPhotoException extends BadRequestException {
  constructor() {
    super(NotBelongPhotoException.name);
  }
}
