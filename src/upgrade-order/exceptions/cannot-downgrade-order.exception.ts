import { BadRequestException } from '@nestjs/common';

export class CannotDowngradeOrderException extends BadRequestException {
  constructor() {
    super(CannotDowngradeOrderException.name);
  }
}
