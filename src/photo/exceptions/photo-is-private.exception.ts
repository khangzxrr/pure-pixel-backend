import { HttpException, HttpStatus } from '@nestjs/common';

export class PhotoIsPrivatedException extends HttpException {
  constructor() {
    super(PhotoIsPrivatedException.name, HttpStatus.BAD_REQUEST);
  }
}
