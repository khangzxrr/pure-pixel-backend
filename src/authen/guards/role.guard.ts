import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserRepository } from 'src/database/repositories/user.repository';
import { SftpService } from 'src/storage/services/sftp.service';
import { PrismaService } from 'src/prisma.service';
import { TokenClaims } from 'src/infrastructure/utils/utils';
import {
  META_ROLES,
  RoleMatchingMode,
  RoleMetadata,
  TokenVerifier,
} from 'src/authen/oidc';
import { AuthenService } from '../services/authen.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: TokenVerifier,
    private userRepository: UserRepository,
    private sftpService: SftpService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private cache: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: TokenClaims }>();

    const user = request.user;

    const roleMetadata = this.reflector.getAllAndOverride<RoleMetadata>(
      META_ROLES,
      [context.getClass(), context.getHandler()],
    );

    if (roleMetadata && roleMetadata.roles?.length) {
      if (!user) {
        return false;
      }

      const userRoles = this.verifier.getRoles(user);
      const matches = (role: string) => userRoles.includes(role);

      const allowed =
        roleMetadata.mode === RoleMatchingMode.ALL
          ? roleMetadata.roles.every(matches)
          : roleMetadata.roles.some(matches);

      if (!allowed) {
        return false;
      }
    }

    if (user) {
      //workaround for cirular dependency when using the same service in authenModule
      const authenService = new AuthenService(
        this.userRepository,
        this.sftpService,
        this.cache,
        this.prisma,
      );

      await authenService.createUserIfNotExist(
        user.sub,
        user.preferred_username as string,
        user.email as string,
      );
    }

    return true;
  }
}
