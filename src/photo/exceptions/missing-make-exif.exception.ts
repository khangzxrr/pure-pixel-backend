import { BadRequestException } from '@nestjs/common';

export class MissingMakeExifException extends BadRequestException {
  constructor() {
    super(MissingMakeExifException.name);
  }
}
