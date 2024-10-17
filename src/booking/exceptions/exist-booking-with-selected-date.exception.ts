import { BadRequestException } from '@nestjs/common';

export class ExistBookingWithSelectedDateException extends BadRequestException {
  constructor() {
    super(ExistBookingWithSelectedDateException.name);
  }
}
