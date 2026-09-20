import { ExecutionContext } from '@nestjs/common';
import { Constants } from './constants';
import { Utils, extractRequest, parseToken } from './utils';

describe('Utils', () => {
  describe('env', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return the environment variable or undefined', () => {
      process.env = { ...originalEnv, UTILS_TEST_VAR: 'value' };

      expect(Utils.env('UTILS_TEST_VAR')).toBe('value');
      expect(Utils.env('UTILS_TEST_MISSING_VAR')).toBeUndefined();
    });
  });

  it('getExtension should return the last dot segment', () => {
    expect(Utils.getExtension('a/b/photo.final.jpg')).toBe('jpg');
  });

  it('removedNullChar should strip null characters and escaped nulls', () => {
    expect(Utils.removedNullChar('a\0b\\u0000c')).toBe('abc');
  });

  describe('normalizeText', () => {
    it.each([undefined, null, ''])('should return null for %p', (text) => {
      expect(Utils.normalizeText(text)).toBeNull();
    });

    it('should trim, lower case and remove vietnamese accents', () => {
      expect(Utils.normalizeText('  Tiếng Việt\0  ')).toBe('tieng viet');
    });
  });

  it('randomString should return alphanumeric string of given length', () => {
    const value = Utils.randomString(16);

    expect(value).toHaveLength(16);
    expect(value).toMatch(/^[A-Za-z0-9]+$/);
    expect(Utils.randomString(0)).toBe('');
  });

  it('regexFileExtension should capture the extension', () => {
    expect(Utils.regexFileExtension.exec('photo.png')?.[1]).toBe('png');
    expect(Utils.regexFileExtension.exec('photo')?.[1]).toBeUndefined();
  });

  it('Constants should expose roles and sort orders', () => {
    expect(Constants.PHOTOGRAPHER_ROLE).toBe('photographer');
    expect(Constants.SORT).toEqual(['asc', 'desc']);
    expect(Constants.DEFAULT_AVATAR).toContain('default-avatar.png');
  });
});

describe('parseToken', () => {
  it('should decode the jwt payload', () => {
    const payload = Buffer.from(
      JSON.stringify({ iss: 'http://kc/realms/pure' }),
    ).toString('base64');

    expect(parseToken(`header.${payload}.signature`)).toEqual({
      iss: 'http://kc/realms/pure',
    });
  });
});

describe('extractRequest', () => {
  const buildContext = (
    type: string,
    overrides: Partial<Record<string, unknown>> = {},
  ) =>
    ({
      getType: () => type,
      ...overrides,
    }) as unknown as ExecutionContext;

  it('should extract request and response for http', () => {
    const request = { req: true };
    const response = { res: true };
    const context = buildContext('http', {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    });

    expect(extractRequest(context)).toEqual([request, response]);
  });

  it('should throw for graphql when @nestjs/graphql is not installed', () => {
    jest.isolateModules(() => {
      jest.doMock(
        '@nestjs/graphql',
        () => {
          throw new Error('Cannot find module');
        },
        { virtual: true },
      );
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- isolateModules needs a fresh module copy
      const isolated: typeof import('./utils') = require('./utils');

      expect(() => isolated.extractRequest(buildContext('graphql'))).toThrow(
        '@nestjs/graphql is not installed, cannot proceed',
      );
    });
  });

  it('should extract request and response from the graphql context', () => {
    jest.isolateModules(() => {
      const request = { gqlReq: true };
      const response = { gqlRes: true };
      const create = jest.fn(() => ({
        getContext: () => ({ req: request, res: response }),
      }));
      jest.doMock(
        '@nestjs/graphql',
        () => ({ GqlExecutionContext: { create } }),
        { virtual: true },
      );
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- isolateModules needs a fresh module copy
      const isolated: typeof import('./utils') = require('./utils');
      const context = buildContext('graphql');

      expect(isolated.extractRequest(context)).toEqual([request, response]);
      expect(create).toHaveBeenCalledWith(context);
    });
  });

  it('should extract request from websocket args', () => {
    const client = { socket: true };
    const context = buildContext('ws', { getArgs: () => [client, 'data'] });

    expect(extractRequest(context)).toEqual([client, undefined]);
  });

  it('should return undefined values for unsupported context types', () => {
    expect(extractRequest(buildContext('rpc'))).toEqual([undefined, undefined]);
  });
});
