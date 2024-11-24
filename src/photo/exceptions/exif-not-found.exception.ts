import { BadRequestException } from '@nestjs/common';

export class ExifNotFoundException extends BadRequestException {
  constructor() {
    super(ExifNotFoundException.name);
  }
}
