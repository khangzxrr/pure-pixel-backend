import { BadRequestException } from '@nestjs/common';

export class SomePhotoNotFoundException extends BadRequestException {
  constructor() {
    super(SomePhotoNotFoundException.name);
  }
}
