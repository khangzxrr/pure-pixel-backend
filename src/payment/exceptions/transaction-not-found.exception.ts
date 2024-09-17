import { BadRequestException } from '@nestjs/common';

export class TransactionNotFoundException extends BadRequestException {
  constructor() {
    super(TransactionNotFoundException.name);
  }
}
