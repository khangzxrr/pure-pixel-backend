import { HttpException } from '@nestjs/common';

export class UploadPhotoFailedException extends HttpException {
  constructor() {
    super(UploadPhotoFailedException.name, 500);
  }
}
