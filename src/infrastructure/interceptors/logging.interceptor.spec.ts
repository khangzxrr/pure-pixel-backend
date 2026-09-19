import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  const next: CallHandler = { handle: () => of('response') };

  it('should log the http request after the handler emits', async () => {
    const request = { method: 'POST', originalUrl: '/photo', body: { a: 1 } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await lastValueFrom(
      new LoggingInterceptor().intercept(context, next) as ReturnType<
        CallHandler['handle']
      >,
    );

    expect(result).toBe('response');
    expect(logSpy).toHaveBeenNthCalledWith(1, 'POST /photo:');
    expect(logSpy).toHaveBeenNthCalledWith(2, { a: 1 });
  });

  it('should skip logging when there is no http context', async () => {
    const context = {
      switchToHttp: () => undefined,
    } as unknown as ExecutionContext;

    const result = await lastValueFrom(
      new LoggingInterceptor().intercept(context, next) as ReturnType<
        CallHandler['handle']
      >,
    );

    expect(result).toBe('response');
    expect(logSpy).not.toHaveBeenCalled();
  });
});
