import { BadRequestException } from '@nestjs/common';

export class BookingNotFinishedLongEnoughException extends BadRequestException {
  constructor() {
    super(BookingNotFinishedLongEnoughException.name);
  }
}
