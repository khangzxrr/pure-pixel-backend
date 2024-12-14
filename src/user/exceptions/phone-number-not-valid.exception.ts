import { BadRequestException } from '@nestjs/common';

export class PhoneNumberNotValidException extends BadRequestException {
  constructor() {
    super(PhoneNumberNotValidException.name);
  }
}
