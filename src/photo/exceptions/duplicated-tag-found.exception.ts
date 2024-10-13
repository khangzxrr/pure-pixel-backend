import { BadRequestException } from '@nestjs/common';

export class DuplicatedTagFoundException extends BadRequestException {
  constructor() {
    super(DuplicatedTagFoundException.name);
  }
}
