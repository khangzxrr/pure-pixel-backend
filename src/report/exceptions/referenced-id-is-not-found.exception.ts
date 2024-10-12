import { NotFoundException } from '@nestjs/common';

export class ReferenceIdNotFoundException extends NotFoundException {
  constructor() {
    super(ReferenceIdNotFoundException.name);
  }
}
