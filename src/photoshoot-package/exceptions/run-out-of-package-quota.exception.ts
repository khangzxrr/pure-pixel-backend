import { BadRequestException } from '@nestjs/common';

export class RunOutOfPacakgeQuotaException extends BadRequestException {
  constructor() {
    super(RunOutOfPacakgeQuotaException.name);
  }
}
