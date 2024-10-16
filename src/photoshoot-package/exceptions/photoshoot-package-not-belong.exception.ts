import { BadRequestException } from '@nestjs/common';

export class PhotoshootPackageNotBelongException extends BadRequestException {
  constructor() {
    super(PhotoshootPackageNotBelongException.name);
  }
}
