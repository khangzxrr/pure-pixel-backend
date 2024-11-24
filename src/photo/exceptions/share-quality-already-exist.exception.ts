import { BadRequestException } from '@nestjs/common';

export class ShareQualityAlreadyExistException extends BadRequestException {
  constructor() {
    super(ShareQualityAlreadyExistException.name);
  }
}
