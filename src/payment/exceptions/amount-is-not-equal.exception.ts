import { BadRequestException } from '@nestjs/common';

export class AmountIsNotEqualException extends BadRequestException {
  constructor() {
    super(AmountIsNotEqualException.name);
  }
}
