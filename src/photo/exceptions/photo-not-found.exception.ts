import { NotFoundException } from '@nestjs/common';

export class PhotoNotFoundException extends NotFoundException {
  constructor() {
    super(PhotoNotFoundException.name);
  }
}
