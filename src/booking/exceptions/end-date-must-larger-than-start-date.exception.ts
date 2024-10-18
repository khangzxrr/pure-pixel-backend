import { BadRequestException } from '@nestjs/common';

export class EndDateMustLargerThanStartDateException extends BadRequestException {
  constructor() {
    super(EndDateMustLargerThanStartDateException.name);
  }
}
