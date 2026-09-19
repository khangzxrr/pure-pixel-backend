import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public, Roles } from 'src/authen/oidc';
import WebsocketAuthGuard from './ws.auth.guard';

class NoDecoratorGateway {
  handler() {}
}

class PublicGateway {
  @Public()
  handler() {}
}

class PublicFalseGateway {
  @Public(false)
  handler() {}
}

class PhotographerGateway {
  @Roles({ roles: ['photographer'] })
  handler() {}
}

class PhotographerCustomerGateway {
  @Roles({ roles: ['photographer', 'customer'] })
  handler() {}
}

describe('WebsocketAuthGuard', () => {
  let reflector: Reflector;
  let verifier: { verify: jest.Mock; getRoles: jest.Mock };

  beforeEach(() => {
    reflector = new Reflector();
    verifier = { verify: jest.fn(), getRoles: jest.fn() };
  });

  const buildContext = (
    gatewayClass: new () => unknown,
    token?: string,
  ): { context: ExecutionContext; socket: Record<string, unknown> } => {
    const instance = new gatewayClass();
    const socket: Record<string, unknown> = {
      handshake: { auth: { token } },
    };

    const context = {
      getType: () => 'ws',
      getClass: () => gatewayClass,
      getHandler: () => (instance as { handler: () => void }).handler,
      switchToWs: () => ({
        getClient: () => socket,
      }),
      getArgs: () => [socket],
    } as unknown as ExecutionContext;

    return { context, socket };
  };

  it('attaches user and accessTokenJWT on a valid token', async () => {
    verifier.verify.mockResolvedValue({ sub: 'u1' });
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context, socket } = buildContext(NoDecoratorGateway, 'Bearer good');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect((socket.user as { sub: string }).sub).toBe('u1');
    expect(socket.accessTokenJWT).toBe('good');
  });

  it('throws UnauthorizedException when there is no token', async () => {
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context } = buildContext(NoDecoratorGateway);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when verify rejects', async () => {
    verifier.verify.mockRejectedValue(new Error('invalid'));
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context } = buildContext(NoDecoratorGateway, 'Bearer good');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('@Public() allows access without a token', async () => {
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context } = buildContext(PublicGateway);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('@Public(false) allows access without a token', async () => {
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context } = buildContext(PublicFalseGateway);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('throws ForbiddenException when the required role is not satisfied', async () => {
    verifier.verify.mockResolvedValue({ sub: 'u1' });
    verifier.getRoles.mockReturnValue(['customer']);
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context } = buildContext(PhotographerGateway, 'Bearer good');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows access when the user has any of the required roles', async () => {
    verifier.verify.mockResolvedValue({ sub: 'u1' });
    verifier.getRoles.mockReturnValue(['customer']);
    const guard = new WebsocketAuthGuard(reflector, verifier as any);
    const { context } = buildContext(
      PhotographerCustomerGateway,
      'Bearer good',
    );

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
