import { Reflector } from '@nestjs/core';
import { Roles, RoleMatchingMode } from 'src/authen/oidc';
import { AuthenService } from 'src/authen/services/authen.service';
import { RoleGuard } from './role.guard';

class NoRolesController {
  handler() {}
}

class PhotographerController {
  @Roles({ roles: ['photographer'] })
  handler() {}
}

class PhotographerCustomerController {
  @Roles({ roles: ['photographer', 'customer'] })
  handler() {}
}

class ManagerAdminAllController {
  @Roles({
    roles: ['manager', 'purepixel-admin'],
    mode: RoleMatchingMode.ALL,
  })
  handler() {}
}

describe('RoleGuard', () => {
  let reflector: Reflector;
  let verifier: { verify: jest.Mock; getRoles: jest.Mock };
  let createUserIfNotExistSpy: jest.SpyInstance;

  beforeEach(() => {
    reflector = new Reflector();
    verifier = {
      verify: jest.fn(),
      getRoles: jest.fn((user: { roles: string[] }) => user?.roles ?? []),
    };
    createUserIfNotExistSpy = jest
      .spyOn(AuthenService.prototype, 'createUserIfNotExist')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    createUserIfNotExistSpy.mockRestore();
  });

  const buildContext = (
    controllerClass: new () => unknown,
    user?: Record<string, unknown>,
  ) => {
    const instance = new controllerClass();
    const request: Record<string, unknown> = user ? { user } : {};

    return {
      getClass: () => controllerClass,
      getHandler: () => (instance as { handler: () => void }).handler,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  const buildGuard = () =>
    new RoleGuard(
      reflector,
      verifier as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

  it('allows access and calls createUserIfNotExist when there is no roles metadata', async () => {
    const guard = buildGuard();
    const context = buildContext(NoRolesController, {
      sub: 'u1',
      preferred_username: 'ann',
      email: 'a@x',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(createUserIfNotExistSpy).toHaveBeenCalledWith('u1', 'ann', 'a@x');
  });

  it('allows access without calling createUserIfNotExist when there is no request.user', async () => {
    const guard = buildGuard();
    const context = buildContext(NoRolesController);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(createUserIfNotExistSpy).not.toHaveBeenCalled();
  });

  it('denies access when the user roles do not match the required role', async () => {
    const guard = buildGuard();
    const context = buildContext(PhotographerController, {
      roles: ['customer'],
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
    expect(createUserIfNotExistSpy).not.toHaveBeenCalled();
  });

  it('allows access when the user has any of the required roles (default ANY mode)', async () => {
    const guard = buildGuard();
    const context = buildContext(PhotographerCustomerController, {
      roles: ['customer'],
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('denies access in ALL mode when the user is missing one of the required roles', async () => {
    const guard = buildGuard();
    const context = buildContext(ManagerAdminAllController, {
      roles: ['manager'],
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('allows access in ALL mode when the user has every required role', async () => {
    const guard = buildGuard();
    const context = buildContext(ManagerAdminAllController, {
      roles: ['manager', 'purepixel-admin'],
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('denies access when roles are required but there is no request.user', async () => {
    const guard = buildGuard();
    const context = buildContext(PhotographerController);

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });
});
