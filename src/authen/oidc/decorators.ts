import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { extractRequest } from 'src/infrastructure/utils/utils';
import {
  META_ROLES,
  META_SKIP_AUTH,
  META_UNPROTECTED,
  RoleMatchingMode,
} from './constants';

//marks a route as reachable without a token
//skipAuth = false still reads and attaches the user when a valid token is sent
export const Public = (skipAuth = true) =>
  applyDecorators(
    SetMetadata(META_UNPROTECTED, true),
    SetMetadata(META_SKIP_AUTH, skipAuth),
  );

export const Roles = (opts: { roles: string[]; mode?: RoleMatchingMode }) =>
  SetMetadata(META_ROLES, opts);

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const [request] = extractRequest<{ user?: unknown }>(context);

    return request?.user;
  },
);
