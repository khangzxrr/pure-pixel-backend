import { BadRequestException } from '@nestjs/common';

export class ExistSuccessedPhotoBuyException extends BadRequestException {
  constructor() {
    super(ExistSuccessedPhotoBuyException.name);
  }
}
