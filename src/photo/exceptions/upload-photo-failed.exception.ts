import { HttpException } from '@nestjs/common';

export class UploadPhotoFailedException extends HttpException {
  constructor(e: object) {
    super(e, 500);
  }
}
