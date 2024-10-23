import { HttpException } from '@nestjs/common';

export class CannotSignNullPhotoException extends HttpException {
  constructor() {
    super(CannotSignNullPhotoException.name, 500);
  }
}
