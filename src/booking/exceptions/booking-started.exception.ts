import { BadRequestException } from '@nestjs/common';

export class BookingStartedException extends BadRequestException {
  constructor() {
    super(BookingStartedException.name);
  }
}
