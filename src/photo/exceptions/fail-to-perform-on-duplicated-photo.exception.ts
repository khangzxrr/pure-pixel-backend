import { BadRequestException } from '@nestjs/common';

export class FailToPerformOnDuplicatedPhotoException extends BadRequestException {
  constructor() {
    super(FailToPerformOnDuplicatedPhotoException.name);
  }
}
