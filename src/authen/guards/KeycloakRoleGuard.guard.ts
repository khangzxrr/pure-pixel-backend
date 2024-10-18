import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  KEYCLOAK_CONNECT_OPTIONS,
  KEYCLOAK_INSTANCE,
  KEYCLOAK_LOGGER,
  KEYCLOAK_MULTITENANT_SERVICE,
  KeycloakMultiTenantService,
  RoleGuard,
} from 'nest-keycloak-connect';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import KeycloakConnect from 'keycloak-connect';
import { KeycloakConnectConfig } from 'nest-keycloak-connect';
import { AuthenService } from '../services/authen.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { SftpService } from 'src/storage/services/sftp.service';
import { PrismaService } from 'src/prisma.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class KeycloakRoleGuard extends RoleGuard implements CanActivate {
  constructor(
    //This must inject as normal parameter because this is global guard
    @Inject(KEYCLOAK_INSTANCE)
    singleTenant: KeycloakConnect.Keycloak,
    @Inject(KEYCLOAK_CONNECT_OPTIONS)
    keycloakOpts: KeycloakConnectConfig,
    @Inject(KEYCLOAK_LOGGER)
    logger: Logger,
    @Inject(KEYCLOAK_MULTITENANT_SERVICE)
    multiTenant: KeycloakMultiTenantService,
    reflector: Reflector,
    private userRepository: UserRepository,
    private sftpService: SftpService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private cache: Cache,

    //App Module init guard <-- Authen Module init guard
    //cannot use dependency like this when authenService is inside authen module
    //private testAuthenService: AuthenService,
  ) {
    super(singleTenant, keycloakOpts, logger, multiTenant, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const grant = await super.canActivate(context);

    if (grant) {
      const request = context.switchToHttp().getRequest();

      const user = request.user as any;

      if (!user) {
        return grant;
      }

      //workaround for cirular dependency when using the same service in authenModule
      const authenService = new AuthenService(
        this.userRepository,
        this.sftpService,
        this.cache,
        this.prisma,
      );

      await authenService.createUserIfNotExist(
        user.sub,
        user.preferred_username,
        user.email,
      );
    }

    return grant;
  }
}
