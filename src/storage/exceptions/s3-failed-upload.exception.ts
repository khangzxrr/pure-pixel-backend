import { HttpException } from '@nestjs/common';

export class S3FailedUploadException extends HttpException {
  constructor() {
    super('S3 failed to upload file', 500);
  }
}
