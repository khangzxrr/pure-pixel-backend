import { BadRequestException } from '@nestjs/common';

export class CreatePhotoSharingFailedException extends BadRequestException {
  constructor() {
    super(CreatePhotoSharingFailedException.name);
  }
}
