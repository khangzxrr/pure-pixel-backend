import { BadRequestException } from '@nestjs/common';

export class CannotBanAdminException extends BadRequestException {
  constructor() {
    super(CannotBanAdminException.name);
  }
}
