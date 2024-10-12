import { NotFoundException } from '@nestjs/common';

export class ReferencedIdIsNotFoundException extends NotFoundException {
  constructor() {
    super(ReferencedIdIsNotFoundException.name);
  }
}
