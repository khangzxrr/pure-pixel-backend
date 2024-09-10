import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';

@Injectable()
export class VietQrBasicStrategy extends PassportStrategy(BasicStrategy) {
  public validate(username: string, password: string): boolean {
    if (
      username === process.env.VIETQR_USERNAME &&
      password === process.env.VIETQR_PASSWORD
    ) {
      return true;
    }

    throw new UnauthorizedException();
  }
}
