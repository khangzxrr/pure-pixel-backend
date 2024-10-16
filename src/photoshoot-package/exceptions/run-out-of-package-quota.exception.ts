import { BadRequestException } from '@nestjs/common';

export class RunOutOfPackageQuotaException extends BadRequestException {
  constructor() {
    super(RunOutOfPackageQuotaException.name);
  }
}
