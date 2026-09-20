import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { Public } from './decorators';

class ProtectedController {
  handler() {}
}

class PublicController {
  @Public()
  handler() {}
}

class PublicFalseController {
  @Public(false)
  handler() {}
}

describe('AuthGuard', () => {
  let reflector: Reflector;
  let verifier: { verify: jest.Mock; getRoles: jest.Mock };

  beforeEach(() => {
    reflector = new Reflector();
    verifier = { verify: jest.fn(), getRoles: jest.fn() };
  });

  const buildContext = (
    controllerClass: new () => unknown,
    headers: Record<string, string>,
  ): { context: ExecutionContext; request: Record<string, unknown> } => {
    const instance = new controllerClass();
    const request: Record<string, unknown> = { headers };

    const context = {
      getClass: () => controllerClass,
      getHandler: () => (instance as { handler: () => void }).handler,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  it('throws UnauthorizedException when there is no decorator and no Authorization header', async () => {
    const guard = new AuthGuard(reflector, verifier as any);
    const { context } = buildContext(ProtectedController, {});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('returns true and attaches user/accessTokenJWT when the header is valid', async () => {
    verifier.verify.mockResolvedValue({ sub: 'u1' });
    const guard = new AuthGuard(reflector, verifier as any);
    const { context, request } = buildContext(ProtectedController, {
      authorization: 'Bearer good',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ sub: 'u1' });
    expect(request.accessTokenJWT).toBe('good');
  });

  it('accepts a lowercase bearer scheme', async () => {
    verifier.verify.mockResolvedValue({ sub: 'u1' });
    const guard = new AuthGuard(reflector, verifier as any);
    const { context } = buildContext(ProtectedController, {
      authorization: 'bearer good',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(verifier.verify).toHaveBeenCalledWith('good');
  });

  it('throws UnauthorizedException when verify rejects and there is no decorator', async () => {
    verifier.verify.mockRejectedValue(new Error('invalid'));
    const guard = new AuthGuard(reflector, verifier as any);
    const { context } = buildContext(ProtectedController, {
      authorization: 'Bearer good',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for a non-bearer scheme on a protected route', async () => {
    const guard = new AuthGuard(reflector, verifier as any);
    const { context } = buildContext(ProtectedController, {
      authorization: 'Basic abc',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('@Public() allows access without reading the header, request.user stays undefined', async () => {
    const guard = new AuthGuard(reflector, verifier as any);
    const { context, request } = buildContext(PublicController, {
      authorization: 'Bearer good',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });

  it('@Public(false) with no header still allows access, request.user stays undefined', async () => {
    const guard = new AuthGuard(reflector, verifier as any);
    const { context, request } = buildContext(PublicFalseController, {});

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('@Public(false) with a valid header attaches request.user', async () => {
    verifier.verify.mockResolvedValue({ sub: 'u2' });
    const guard = new AuthGuard(reflector, verifier as any);
    const { context, request } = buildContext(PublicFalseController, {
      authorization: 'Bearer good',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect((request.user as { sub: string }).sub).toBe('u2');
  });

  it('@Public(false) with a header that fails verify still allows access, request.user stays undefined', async () => {
    verifier.verify.mockRejectedValue(new Error('invalid'));
    const guard = new AuthGuard(reflector, verifier as any);
    const { context, request } = buildContext(PublicFalseController, {
      authorization: 'Bearer good',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toBeUndefined();
  });
});
