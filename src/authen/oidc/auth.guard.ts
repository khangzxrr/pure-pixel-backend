import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenClaims } from 'src/infrastructure/utils/utils';
import { META_SKIP_AUTH, META_UNPROTECTED } from './constants';
import { TokenVerifier } from './token-verifier';

//request before authentication, the user is attached by this guard
type AuthenticatedRequest = {
  headers?: Record<string, string | undefined>;
  user?: TokenClaims;
  accessTokenJWT?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

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

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const jwt = this.extractJwt(request.headers);

    if (!jwt) {
      if (isUnprotected) {
        return true;
      }

      throw new UnauthorizedException();
    }

    let claims: TokenClaims;

    try {
      claims = await this.verifier.verify(jwt);
    } catch (e) {
      this.logger.verbose(`Cannot validate access token: ${e}`);

      if (isUnprotected) {
        return true;
      }

      throw new UnauthorizedException();
    }

    request.user = claims;
    request.accessTokenJWT = jwt;

    return true;
  }

  private extractJwt(headers?: Record<string, string | undefined>) {
    const authorization = headers?.authorization;

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
