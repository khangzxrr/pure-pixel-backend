import { BadRequestException } from '@nestjs/common';

export class BookingNotAcceptedException extends BadRequestException {
  constructor() {
    super(BookingNotAcceptedException.name);
  }
}
