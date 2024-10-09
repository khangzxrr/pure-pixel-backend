import { HttpException } from '@nestjs/common';
import { HttpStatusCode } from 'axios';

export class SftpFailedCreateUser extends HttpException {
  _subMessage: string;
  constructor(subMessage: string) {
    console.log(subMessage);
    super(SftpFailedCreateUser.name, HttpStatusCode.InternalServerError);
    this._subMessage = subMessage;
  }

  public get subMessage() {
    return this._subMessage;
  }
}
