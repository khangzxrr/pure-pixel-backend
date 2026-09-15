import { UnauthorizedException } from '@nestjs/common';
import { VietQrBasicStrategy } from './viet-qr.basic-strategy';

describe('VietQrBasicStrategy', () => {
  const originalUsername = process.env.VIETQR_USERNAME;
  const originalPassword = process.env.VIETQR_PASSWORD;
  let strategy: VietQrBasicStrategy;

  beforeEach(() => {
    process.env.VIETQR_USERNAME = 'vietqr';
    process.env.VIETQR_PASSWORD = 'secret';
    strategy = new VietQrBasicStrategy();
  });

  afterEach(() => {
    process.env.VIETQR_USERNAME = originalUsername;
    process.env.VIETQR_PASSWORD = originalPassword;
  });

  it('should return true for valid credentials', () => {
    expect(strategy.validate('vietqr', 'secret')).toBe(true);
  });

  it('should throw UnauthorizedException for wrong password', () => {
    expect(() => strategy.validate('vietqr', 'wrong')).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for wrong username', () => {
    expect(() => strategy.validate('other', 'secret')).toThrow(
      UnauthorizedException,
    );
  });
});
