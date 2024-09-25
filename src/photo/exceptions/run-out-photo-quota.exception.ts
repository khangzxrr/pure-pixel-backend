import { BadRequestException } from '@nestjs/common';

export class RunOutPhotoQuotaException extends BadRequestException {
  constructor() {
    super(RunOutPhotoQuotaException.name);
  }
}
