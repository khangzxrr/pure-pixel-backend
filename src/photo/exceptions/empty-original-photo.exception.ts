import { HttpException } from '@nestjs/common';

export class EmptyOriginalPhotoException extends HttpException {
  constructor() {
    super(EmptyOriginalPhotoException.name, 500);
  }
}
