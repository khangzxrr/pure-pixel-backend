import { BadRequestException } from '@nestjs/common';

export class NotAWithdrawalTransaction extends BadRequestException {
  constructor() {
    super(NotAWithdrawalTransaction.name);
  }
}
