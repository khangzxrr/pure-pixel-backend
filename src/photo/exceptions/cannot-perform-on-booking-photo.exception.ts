import { BadRequestException } from '@nestjs/common';

export class CannotPerformOnBookingPhoto extends BadRequestException {
  constructor() {
    super(CannotPerformOnBookingPhoto.name);
  }
}
