import { HttpException } from '@nestjs/common';

export class CannotCreateNewUserException extends HttpException {
  constructor() {
    super('Cannot create new user', 500, {});
  }
}
