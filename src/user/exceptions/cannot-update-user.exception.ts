import { HttpException } from '@nestjs/common';

export class FailedToUpdateUserException extends HttpException {
  constructor() {
    super(FailedToUpdateUserException.name, 500);
  }
}
