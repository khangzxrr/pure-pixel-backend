import { BadRequestException } from '@nestjs/common';

export class BookingNotInRequestedStateException extends BadRequestException {
  constructor() {
    super(BookingNotInRequestedStateException.name);
  }
}
