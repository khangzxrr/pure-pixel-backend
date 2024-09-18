import { BadRequestException } from '@nestjs/common';

export class TotalMonthLesserThanMinMonthException extends BadRequestException {
  constructor() {
    super(TotalMonthLesserThanMinMonthException.name);
  }
}
