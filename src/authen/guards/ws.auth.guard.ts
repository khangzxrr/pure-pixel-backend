import {
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import {
  KEYCLOAK_CONNECT_OPTIONS,
  KEYCLOAK_COOKIE_DEFAULT,
  KEYCLOAK_INSTANCE,
  KEYCLOAK_LOGGER,
  KEYCLOAK_MULTITENANT_SERVICE,
  KeycloakMultiTenantService,
  META_SKIP_AUTH,
  META_UNPROTECTED,
  TokenValidation,
} from 'nest-keycloak-connect';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import KeycloakConnect from 'keycloak-connect';
import { KeycloakConnectConfig } from 'nest-keycloak-connect';
import {
  extractRequest,
  parseToken,
  useKeycloak,
} from 'src/infrastructure/utils/utils';

//not work properly with HTTP, use carefully for WS only!
export default class WebsocketAuthGuard implements CanActivate {
  constructor(
    //This must inject as normal parameter because this is global guard
    @Inject(KEYCLOAK_INSTANCE)
    private singleTenant: KeycloakConnect.Keycloak,
    @Inject(KEYCLOAK_CONNECT_OPTIONS)
    private readonly keycloakOpts: KeycloakConnectConfig,
    @Inject(KEYCLOAK_LOGGER)
    private readonly logger: Logger,
    @Inject(KEYCLOAK_MULTITENANT_SERVICE)
    private readonly multiTenant: KeycloakMultiTenantService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isUnprotected = this.reflector.getAllAndOverride<boolean>(
      META_UNPROTECTED,
      [context.getClass(), context.getHandler()],
    );
    const skipAuth = this.reflector.getAllAndOverride<boolean>(META_SKIP_AUTH, [
      context.getClass(),
      context.getHandler(),
    ]);

    // If unprotected is set skip Keycloak authentication
    if (isUnprotected && skipAuth) {
      return true;
    }

    // Extract request/response
    const [request] = extractRequest(context);

    const jwt = this.extractJwt(request.handshake.headers);
    const isJwtEmpty = jwt === null || jwt === undefined;

    // Empty jwt, but skipAuth = false, isUnprotected = true allow fallback
    if (isJwtEmpty && !skipAuth && isUnprotected) {
      this.logger.verbose(
        'Empty JWT, skipAuth disabled, and a publicly marked route, allowed for fallback',
      );
      return true;
    }

    // Empty jwt given, immediate return
    if (isJwtEmpty) {
      this.logger.verbose('Empty JWT, unauthorized');
      throw new UnauthorizedException();
    }

    this.logger.verbose(`User JWT: ${jwt}`);

    const keycloak = await useKeycloak(
      request,
      jwt,
      this.singleTenant,
      this.multiTenant,
      this.keycloakOpts,
    );
    const isValidToken = await this.validateToken(keycloak, jwt);

    if (isValidToken) {
      // Attach user info object
      request.user = parseToken(jwt);
      // Attach raw access token JWT extracted from bearer/cookie
      request.accessTokenJWT = jwt;

      this.logger.verbose(
        `Authenticated User: ${JSON.stringify(request.user)}`,
      );
      return true;
    }

    throw new UnauthorizedException();
  }

  private async validateToken(keycloak: KeycloakConnect.Keycloak, jwt: any) {
    const tokenValidation =
      this.keycloakOpts.tokenValidation || TokenValidation.ONLINE;

    const gm = keycloak.grantManager;
    let grant: KeycloakConnect.Grant;

    try {
      grant = await gm.createGrant({ access_token: jwt });
    } catch (ex) {
      this.logger.warn(`Cannot validate access token: ${ex}`);
      // It will fail to create grants on invalid access token (i.e expired or wrong domain)
      return false;
    }

    const token = grant.access_token;

    this.logger.verbose(
      `Using token validation method: ${tokenValidation.toUpperCase()}`,
    );

    try {
      let result: boolean | KeycloakConnect.Token;

      switch (tokenValidation) {
        case TokenValidation.ONLINE:
          result = await gm.validateAccessToken(token);
          return result === token;
        case TokenValidation.OFFLINE:
          result = await gm.validateToken(token, 'Bearer');
          return result === token;
        case TokenValidation.NONE:
          return true;
        default:
          this.logger.warn(`Unknown validation method: ${tokenValidation}`);
          return false;
      }
    } catch (ex) {
      this.logger.warn(`Cannot validate access token: ${ex}`);
    }

    return false;
  }

  private extractJwt(headers: { [key: string]: string }) {
    if (headers && !headers.authorization) {
      this.logger.verbose(`No authorization header`);
      return null;
    }

    const auth = headers.authorization.split(' ');

    // We only allow bearer
    if (auth[0].toLowerCase() !== 'bearer') {
      this.logger.verbose(`No bearer header`);
      return null;
    }

    return auth[1];
  }

  private extractJwtFromCookie(cookies: { [key: string]: string }) {
    const cookieKey = this.keycloakOpts.cookieKey || KEYCLOAK_COOKIE_DEFAULT;

    return cookies && cookies[cookieKey];
  }
}
