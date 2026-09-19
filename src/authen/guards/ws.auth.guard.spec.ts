import {
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import KeycloakConnect from 'keycloak-connect';
import {
  KEYCLOAK_COOKIE_DEFAULT,
  KeycloakConnectConfig,
  KeycloakMultiTenantService,
  META_ROLES,
  META_SKIP_AUTH,
  META_UNPROTECTED,
  RoleMatchingMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import WebsocketAuthGuard from './ws.auth.guard';

const makeJwt = (payload: object) =>
  [
    Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64'),
    Buffer.from(JSON.stringify(payload)).toString('base64'),
    'signature',
  ].join('.');

describe('WebsocketAuthGuard', () => {
  const jwt = makeJwt({ sub: 'u1', iss: 'https://kc/realms/purepixel' });

  let metadata: {
    unprotected?: boolean;
    skipAuth?: boolean;
    roles?: { roles: string[]; mode?: RoleMatchingMode };
  };
  let reflector: { getAllAndOverride: jest.Mock };
  let logger: { verbose: jest.Mock; warn: jest.Mock };
  let grantManager: {
    createGrant: jest.Mock;
    validateAccessToken: jest.Mock;
    validateToken: jest.Mock;
  };
  let singleTenant: KeycloakConnect.Keycloak;
  let multiTenant: { get: jest.Mock };
  let opts: KeycloakConnectConfig;
  let client: {
    handshake: { auth: { [key: string]: string } };
    user?: unknown;
    accessTokenJWT?: string;
  };
  let context: ExecutionContext;
  let token: KeycloakConnect.Token;

  const createGuard = () =>
    new WebsocketAuthGuard(
      singleTenant,
      opts,
      logger as unknown as Logger,
      multiTenant as unknown as KeycloakMultiTenantService,
      reflector as unknown as Reflector,
    );

  beforeEach(() => {
    metadata = {};
    reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === META_ROLES
          ? metadata.roles
          : key === META_UNPROTECTED
            ? metadata.unprotected
            : metadata.skipAuth,
      ),
    };
    logger = { verbose: jest.fn(), warn: jest.fn() };

    token = {
      token: jwt,
      hasRole: jest.fn((role: string) => role === 'customer'),
    } as unknown as KeycloakConnect.Token;
    grantManager = {
      createGrant: jest.fn().mockResolvedValue({ access_token: token }),
      validateAccessToken: jest.fn().mockResolvedValue(token),
      validateToken: jest.fn().mockResolvedValue(token),
    };
    singleTenant = { grantManager } as unknown as KeycloakConnect.Keycloak;
    multiTenant = { get: jest.fn() };
    opts = { realm: 'purepixel' } as KeycloakConnectConfig;

    client = { handshake: { auth: { token: `Bearer ${jwt}` } } };
    const handler = () => undefined;
    class Gateway {}
    context = {
      getType: () => 'ws',
      getArgs: () => [client],
      getClass: () => Gateway,
      getHandler: () => handler,
    } as unknown as ExecutionContext;
  });

  it('allows unprotected routes that skip auth without reading the token', async () => {
    metadata = { unprotected: true, skipAuth: true };
    client.handshake.auth = {};

    await expect(createGuard().canActivate(context)).resolves.toBe(true);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(META_UNPROTECTED, [
      expect.any(Function),
      expect.any(Function),
    ]);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      META_SKIP_AUTH,
      expect.any(Array),
    );
    expect(grantManager.createGrant).not.toHaveBeenCalled();
  });

  it('allows a public route without token as fallback', async () => {
    metadata = { unprotected: true, skipAuth: false };
    client.handshake.auth = {};

    await expect(createGuard().canActivate(context)).resolves.toBe(true);
    expect(grantManager.createGrant).not.toHaveBeenCalled();
  });

  it('rejects a protected route without token', async () => {
    client.handshake.auth = {};

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a non bearer token', async () => {
    client.handshake.auth = { token: `Basic ${jwt}` };

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(logger.verbose).toHaveBeenCalledWith('No bearer header');
  });

  it('attaches the parsed user and jwt for a valid token (online validation by default)', async () => {
    await expect(createGuard().canActivate(context)).resolves.toBe(true);

    expect(grantManager.createGrant).toHaveBeenCalledWith({
      access_token: jwt,
    });
    expect(grantManager.validateAccessToken).toHaveBeenCalledWith(token);
    expect(client.user).toEqual({
      sub: 'u1',
      iss: 'https://kc/realms/purepixel',
    });
    expect(client.accessTokenJWT).toBe(jwt);
  });

  it('allows a token that has any of the handler roles', async () => {
    metadata = { roles: { roles: ['photographer', 'customer'] } };

    await expect(createGuard().canActivate(context)).resolves.toBe(true);
    expect(token.hasRole).toHaveBeenCalledWith('customer');
  });

  it('rejects a token without any of the handler roles', async () => {
    metadata = { roles: { roles: ['manager', 'admin'] } };

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(client.user).toBeUndefined();
  });

  it('requires every role in ALL matching mode', async () => {
    metadata = {
      roles: { roles: ['customer', 'manager'], mode: RoleMatchingMode.ALL },
    };

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('accepts a lowercase bearer prefix and resolves the realm from the issuer without a configured realm', async () => {
    opts = {} as KeycloakConnectConfig;
    multiTenant.get.mockResolvedValue(singleTenant);
    client.handshake.auth = { token: `bearer ${jwt}` };

    await expect(createGuard().canActivate(context)).resolves.toBe(true);
    expect(multiTenant.get).toHaveBeenCalledWith('purepixel', client);
  });

  it('rejects when online validation returns a different token', async () => {
    grantManager.validateAccessToken.mockResolvedValue(false);

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(client.user).toBeUndefined();
  });

  it('uses offline validation when configured', async () => {
    opts.tokenValidation = TokenValidation.OFFLINE;

    await expect(createGuard().canActivate(context)).resolves.toBe(true);
    expect(grantManager.validateToken).toHaveBeenCalledWith(token, 'Bearer');
    expect(grantManager.validateAccessToken).not.toHaveBeenCalled();
  });

  it('rejects when offline validation fails', async () => {
    opts.tokenValidation = TokenValidation.OFFLINE;
    grantManager.validateToken.mockResolvedValue(false);

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('skips validation when token validation is NONE', async () => {
    opts.tokenValidation = TokenValidation.NONE;

    await expect(createGuard().canActivate(context)).resolves.toBe(true);
    expect(grantManager.validateToken).not.toHaveBeenCalled();
    expect(grantManager.validateAccessToken).not.toHaveBeenCalled();
  });

  it('rejects an unknown validation method', async () => {
    opts.tokenValidation = 'magic' as TokenValidation;

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Unknown validation method: magic',
    );
  });

  it('rejects when the grant cannot be created', async () => {
    grantManager.createGrant.mockRejectedValue(new Error('expired'));

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Cannot validate access token: Error: expired',
    );
  });

  it('rejects when the grant has no access token', async () => {
    grantManager.createGrant.mockResolvedValue({});

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Cannot validate access token: Error: invalid token (missing)',
    );
  });

  it('rejects when validation throws', async () => {
    grantManager.validateAccessToken.mockRejectedValue(new Error('network'));

    await expect(createGuard().canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Cannot validate access token: Error: network',
    );
  });

  describe('extractJwtFromCookie', () => {
    it('reads the default cookie key', () => {
      const guard = createGuard();

      expect(
        guard['extractJwtFromCookie']({
          [KEYCLOAK_COOKIE_DEFAULT]: 'cookie-jwt',
        }),
      ).toBe('cookie-jwt');
    });

    it('reads the configured cookie key', () => {
      opts.cookieKey = 'custom';
      const guard = createGuard();

      expect(guard['extractJwtFromCookie']({ custom: 'custom-jwt' })).toBe(
        'custom-jwt',
      );
    });

    it('returns undefined without cookies', () => {
      const guard = createGuard();

      expect(
        guard['extractJwtFromCookie'](
          undefined as unknown as { [key: string]: string },
        ),
      ).toBeUndefined();
    });
  });
});
