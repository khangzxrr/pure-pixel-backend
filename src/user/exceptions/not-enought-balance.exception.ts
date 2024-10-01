import { BadRequestException } from '@nestjs/common';

export class NotEnoughBalanceException extends BadRequestException {
  constructor() {
    super(NotEnoughBalanceException.name);
  }
}
