import { BadRequestException } from '@nestjs/common';

export class SharePhotoUrlIsEmptyException extends BadRequestException {
  constructor() {
    super(SharePhotoUrlIsEmptyException.name);
  }
}
