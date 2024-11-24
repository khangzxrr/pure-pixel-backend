import { BadRequestException } from '@nestjs/common';

export class SellQualityNotExistException extends BadRequestException {
  constructor() {
    super(SellQualityNotExistException.name);
  }
}
