import { BadRequestException } from '@nestjs/common';

export class BookingNotInValidStateException extends BadRequestException {
  constructor() {
    super(BookingNotInValidStateException.name);
  }
}
