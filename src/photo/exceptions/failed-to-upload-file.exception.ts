import { HttpException } from '@nestjs/common';

export class FailedToUploadFileException extends HttpException {
  constructor() {
    super(FailedToUploadFileException.name, 500);
  }
}
