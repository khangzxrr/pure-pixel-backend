import { NotFoundException } from '@nestjs/common';

export class BlogNotFoundException extends NotFoundException {
  constructor() {
    super(BlogNotFoundException.name);
  }
}
