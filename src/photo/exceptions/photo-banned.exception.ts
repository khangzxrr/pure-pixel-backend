import { BadRequestException } from '@nestjs/common';

export class PhotoBannedException extends BadRequestException {
  constructor() {
    super(PhotoBannedException.name);
  }
}
