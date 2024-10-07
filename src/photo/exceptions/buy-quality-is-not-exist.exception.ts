import { BadRequestException } from '@nestjs/common';

export class BuyQualityIsNotExistException extends BadRequestException {
  constructor() {
    super(BuyQualityIsNotExistException.name);
  }
}
