import { BadRequestException } from '@nestjs/common';

export class ExistPendingWithdrawalException extends BadRequestException {
  constructor() {
    super(ExistPendingWithdrawalException.name);
  }
}
