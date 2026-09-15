import { Cache } from '@nestjs/cache-manager';
import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import KeycloakConnect from 'keycloak-connect';
import {
  KeycloakConnectConfig,
  KeycloakMultiTenantService,
  RoleGuard,
} from 'nest-keycloak-connect';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PrismaService } from 'src/prisma.service';
import { SftpService } from 'src/storage/services/sftp.service';
import { AuthenService } from '../services/authen.service';
import { KeycloakRoleGuard } from './KeycloakRoleGuard.guard';

describe('KeycloakRoleGuard', () => {
  let superCanActivate: jest.SpyInstance;
  let createUserIfNotExist: jest.SpyInstance;
  let request: { user?: unknown };
  let context: ExecutionContext;
  let guard: KeycloakRoleGuard;

  beforeEach(() => {
    superCanActivate = jest.spyOn(RoleGuard.prototype, 'canActivate');
    createUserIfNotExist = jest
      .spyOn(AuthenService.prototype, 'createUserIfNotExist')
      .mockResolvedValue(undefined);

    request = {};
    context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    guard = new KeycloakRoleGuard(
      {} as KeycloakConnect.Keycloak,
      {} as KeycloakConnectConfig,
      {} as Logger,
      {} as KeycloakMultiTenantService,
      {} as Reflector,
      {} as UserRepository,
      {} as SftpService,
      {} as PrismaService,
      {} as Cache,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('denies without creating a user when the role guard denies', async () => {
    superCanActivate.mockResolvedValue(false);
    request.user = { sub: 'u1' };

    await expect(guard.canActivate(context)).resolves.toBe(false);

    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(createUserIfNotExist).not.toHaveBeenCalled();
  });

  it('grants without creating a user when the request has no user', async () => {
    superCanActivate.mockResolvedValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(createUserIfNotExist).not.toHaveBeenCalled();
  });

  it('creates the authenticated user if needed and grants', async () => {
    superCanActivate.mockResolvedValue(true);
    request.user = {
      sub: 'u1',
      preferred_username: 'john',
      email: 'john@mail.com',
    };

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(createUserIfNotExist).toHaveBeenCalledWith(
      'u1',
      'john',
      'john@mail.com',
    );
  });

  it('propagates user creation failures', async () => {
    superCanActivate.mockResolvedValue(true);
    request.user = { sub: 'u1' };
    createUserIfNotExist.mockRejectedValue(new Error('db down'));

    await expect(guard.canActivate(context)).rejects.toThrow('db down');
  });
});
