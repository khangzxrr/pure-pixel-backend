import { BadRequestException } from '@nestjs/common';

export class BookingNotBelongException extends BadRequestException {
  constructor() {
    super(BookingNotBelongException.name);
  }
}
