import { BadRequestException } from '@nestjs/common';

export class ExistPhotoBuyException extends BadRequestException {
  constructor() {
    super(ExistPhotoBuyException.name);
  }
}
