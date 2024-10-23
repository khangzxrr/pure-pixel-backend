import { BadRequestException } from '@nestjs/common';

export class MissingModelExifException extends BadRequestException {
  constructor() {
    super(MissingModelExifException.name);
  }
}
