import { BadRequestException } from '@nestjs/common';

export class CannotBookOwnedPhotoshootPackageException extends BadRequestException {
  constructor() {
    super(CannotBookOwnedPhotoshootPackageException.name);
  }
}
