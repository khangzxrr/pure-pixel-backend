import { BadRequestException } from '@nestjs/common';

export class FileShouldNotBeNullException extends BadRequestException {
  constructor() {
    super(FileShouldNotBeNullException.name);
  }
}
