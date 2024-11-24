import { BadRequestException } from '@nestjs/common';

export class NotValidExpireDateException extends BadRequestException {
  constructor() {
    super(NotValidExpireDateException.name);
  }
}
