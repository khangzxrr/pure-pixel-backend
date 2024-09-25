import { BadRequestException } from '@nestjs/common';

export class NotBelongTransactionException extends BadRequestException {
  constructor() {
    super(NotBelongTransactionException.name);
  }
}
