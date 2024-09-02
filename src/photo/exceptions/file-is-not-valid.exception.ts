import { BadRequestException } from '@nestjs/common';

export class FileIsNotValidException extends BadRequestException {
  constructor() {
    super(FileIsNotValidException.name);
  }
}
