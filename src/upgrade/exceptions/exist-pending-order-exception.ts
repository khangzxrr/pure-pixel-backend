import { BadRequestException } from '@nestjs/common';

export class ExistPendingOrderException extends BadRequestException {
  constructor() {
    super(ExistPendingOrderException.name);
  }
}
