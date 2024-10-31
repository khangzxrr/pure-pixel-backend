import { BadRequestException } from '@nestjs/common';

export class TransactionNotInPendingException extends BadRequestException {
  constructor() {
    super(TransactionNotInPendingException);
  }
}
