import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { extractRequest, TokenClaims } from 'src/infrastructure/utils/utils';
import {
  META_ROLES,
  META_SKIP_AUTH,
  META_UNPROTECTED,
  RoleMatchingMode,
  RoleMetadata,
  TokenVerifier,
} from 'src/authen/oidc';

//socket handled by a gateway method guarded with WebsocketAuthGuard
export interface AuthenticatedSocket extends Socket {
  user: TokenClaims;
  accessTokenJWT: string;
}

//before authentication the socket has no user attached yet
type WebsocketRequest = Socket &
  Partial<Pick<AuthenticatedSocket, 'user' | 'accessTokenJWT'>>;

//not work properly with HTTP, use carefully for WS only!
@Injectable()
export default class WebsocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebsocketAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: TokenVerifier,
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

    if (isUnprotected && skipAuth) {
      return true;
    }

    const [wsRequest] = extractRequest<WebsocketRequest>(context);
    //ws contexts always carry the client socket as the first argument
    const request = wsRequest!;

    const jwt = this.extractJwt(request.handshake?.auth);

    if (!jwt) {
      if (isUnprotected) {
        return true;
      }

      this.logger.verbose('Empty JWT, unauthorized');
      throw new UnauthorizedException();
    }

    let claims: TokenClaims;

    try {
      claims = await this.verifier.verify(jwt);
    } catch (e) {
      this.logger.warn(`Cannot validate access token: ${e}`);

      if (isUnprotected) {
        return true;
      }

      throw new UnauthorizedException();
    }

    const roleMetadata = this.reflector.getAllAndOverride<RoleMetadata>(
      META_ROLES,
      [context.getClass(), context.getHandler()],
    );

    if (roleMetadata && roleMetadata.roles?.length) {
      const userRoles = this.verifier.getRoles(claims);
      const matches = (role: string) => userRoles.includes(role);

      const allowed =
        roleMetadata.mode === RoleMatchingMode.ALL
          ? roleMetadata.roles.every(matches)
          : roleMetadata.roles.some(matches);

      if (!allowed) {
        this.logger.verbose(
          `Missing any of roles ${roleMetadata.roles.join(', ')}`,
        );
        throw new ForbiddenException();
      }
    }

    request.user = claims;
    request.accessTokenJWT = jwt;

    return true;
  }

  private extractJwt(auth?: { token?: string }) {
    if (!auth?.token) {
      this.logger.verbose('No token on the socket handshake');
      return null;
    }

    const [scheme, token] = auth.token.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      this.logger.verbose('No bearer token');
      return null;
    }

    return token;
  }
}
