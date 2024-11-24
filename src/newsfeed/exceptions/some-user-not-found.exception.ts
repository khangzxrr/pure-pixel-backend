import { BadRequestException } from '@nestjs/common';

export class SomeUserNotFoundException extends BadRequestException {
  constructor() {
    super(SomeUserNotFoundException.name);
  }
}
