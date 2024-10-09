import { BadRequestException } from '@nestjs/common';

export class PhotoBuyTransactionIsNotSuccessException extends BadRequestException {
  constructor() {
    super(PhotoBuyTransactionIsNotSuccessException.name);
  }
}
