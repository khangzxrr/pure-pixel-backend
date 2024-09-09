import { HttpException } from '@nestjs/common';
import { HttpStatusCode } from 'axios';

export class DuplicatedUserIdException extends HttpException {
  constructor() {
    super(DuplicatedUserIdException.name, HttpStatusCode.Conflict);
  }
}
