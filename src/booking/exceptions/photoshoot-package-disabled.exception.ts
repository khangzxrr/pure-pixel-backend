import { BadRequestException } from '@nestjs/common';

export class PhotoshootPackageDisabledException extends BadRequestException {
  constructor() {
    super(PhotoshootPackageDisabledException.name);
  }
}
