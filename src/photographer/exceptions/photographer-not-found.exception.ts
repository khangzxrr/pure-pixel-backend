import { NotFoundException } from '@nestjs/common';

export class PhotographerNotFoundException extends NotFoundException {
  constructor() {
    super(PhotographerNotFoundException.name);
  }
}
