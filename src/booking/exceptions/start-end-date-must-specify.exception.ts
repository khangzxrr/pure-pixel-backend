import { BadRequestException } from '@nestjs/common';

export class BothStartEndDateMustSpecifyException extends BadRequestException {
  constructor() {
    super(BothStartEndDateMustSpecifyException.name);
  }
}
