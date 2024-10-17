import { BadRequestException } from '@nestjs/common';

export class StartDateMustLargerThanCurrentDateByOneDayException extends BadRequestException {
  constructor() {
    super(StartDateMustLargerThanCurrentDateByOneDayException.name);
  }
}
