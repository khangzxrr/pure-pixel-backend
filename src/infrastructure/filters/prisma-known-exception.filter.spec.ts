import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaKnownExceptionFilter } from './prisma-known-exception.filter';

describe('PrismaKnownExceptionFilter', () => {
  const reply = jest.fn();
  const response = { res: true };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  const filter = new PrismaKnownExceptionFilter({
    httpAdapter: { reply },
  } as unknown as HttpAdapterHost);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reply 404 for record not found (P2025)', () => {
    const exception = new PrismaClientKnownRequestError('not found', {
      code: 'P2025',
      clientVersion: '5.22.0',
    });

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'not found',
        timestamp: expect.any(String),
      }),
      HttpStatus.NOT_FOUND,
    );
  });

  it('should log and reply 500 for other known errors', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const exception = new PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: '5.22.0',
    });

    filter.catch(exception, host);

    expect(logSpy).toHaveBeenCalledWith(exception);
    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'unique',
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    logSpy.mockRestore();
  });
});
