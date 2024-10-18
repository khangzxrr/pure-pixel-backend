import { BadRequestException } from '@nestjs/common';

export class HourBetweenStartAndEndDateMustNotLessThanThreeException extends BadRequestException {
  constructor() {
    super(HourBetweenStartAndEndDateMustNotLessThanThreeException.name);
  }
}
