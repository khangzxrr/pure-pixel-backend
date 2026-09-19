import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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
  META_ROLES,
  META_SKIP_AUTH,
  META_UNPROTECTED,
  RoleMatchingMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import KeycloakConnect from 'keycloak-connect';
import { KeycloakConnectConfig } from 'nest-keycloak-connect';
import { Socket } from 'socket.io';
import {
  extractRequest,
  parseToken,
  TokenClaims,
  useKeycloak,
} from 'src/infrastructure/utils/utils';

//keycloak-connect builds the Token itself from a raw access token string
//(GrantManager.createGrant in grant-manager.js), but its typings only accept a Token
declare module 'keycloak-connect' {
  interface GrantManager {
    createGrant(data: { access_token: string }): Promise<KeycloakConnect.Grant>;
  }
}

//metadata set by @Roles (nest-keycloak-connect does not export its interface)
type RoleMetadata = { roles?: string[]; mode?: RoleMatchingMode };

//socket handled by a gateway method guarded with WebsocketAuthGuard
export interface AuthenticatedSocket extends Socket {
  user: TokenClaims;
  accessTokenJWT: string;
}

//before authentication the socket has no user attached yet
type WebsocketRequest = Socket &
  Partial<Pick<AuthenticatedSocket, 'user' | 'accessTokenJWT'>>;

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
    const [wsRequest] = extractRequest<WebsocketRequest>(context);
    //ws contexts always carry the client socket as the first argument
    const request = wsRequest!;

    const jwt = this.extractJwt(request.handshake.auth);
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
    const token = await this.validateToken(keycloak, jwt);

    if (token) {
      //@Roles on a gateway handler: the same check RoleGuard does for http routes
      const roleMetadata =
        this.reflector.getAllAndOverride<RoleMetadata>(
          META_ROLES,
          [context.getClass(), context.getHandler()],
        );
      if (roleMetadata && roleMetadata.roles?.length) {
        const matches = (role: string) => token.hasRole(role);
        const roles = roleMetadata.roles;
        const allowed =
          roleMetadata.mode === RoleMatchingMode.ALL
            ? roles.every(matches)
            : roles.some(matches);

        if (!allowed) {
          this.logger.verbose(`Missing any of roles ${roles.join(', ')}`);
          throw new ForbiddenException();
        }
      }

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

  //resolves the validated token, or null when it is not valid
  private async validateToken(
    keycloak: KeycloakConnect.Keycloak,
    jwt: string,
  ): Promise<KeycloakConnect.Token | null> {
    const tokenValidation =
      this.keycloakOpts.tokenValidation || TokenValidation.ONLINE;

    const gm = keycloak.grantManager;
    let grant: KeycloakConnect.Grant;

    try {
      grant = await gm.createGrant({ access_token: jwt });
    } catch (ex) {
      this.logger.warn(`Cannot validate access token: ${ex}`);
      // It will fail to create grants on invalid access token (i.e expired or wrong domain)
      return null;
    }

    const token = grant.access_token;

    this.logger.verbose(
      `Using token validation method: ${tokenValidation.toUpperCase()}`,
    );

    try {
      let result: false | KeycloakConnect.Token;

      //createGrant validates access_token, so a grant without one never reaches here
      //keep the same outcome as validateToken(undefined): an error that is logged below
      if (!token) {
        throw new Error('invalid token (missing)');
      }

      switch (tokenValidation) {
        case TokenValidation.ONLINE:
          result = await gm.validateAccessToken(token);
          return result === token ? token : null;
        case TokenValidation.OFFLINE:
          result = await gm.validateToken(token, 'Bearer');
          return result === token ? token : null;
        case TokenValidation.NONE:
          return token;
        default:
          this.logger.warn(`Unknown validation method: ${tokenValidation}`);
          return null;
      }
    } catch (ex) {
      this.logger.warn(`Cannot validate access token: ${ex}`);
    }

    return null;
  }

  private extractJwt(headers: { [key: string]: string }) {
    if (headers && !headers.token) {
      this.logger.verbose(`No authorization header`);
      return null;
    }

    const auth = headers.token.split(' ');

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
