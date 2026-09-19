import { Reflector } from '@nestjs/core';
import {
  META_ROLES,
  META_SKIP_AUTH,
  META_UNPROTECTED,
  RoleMatchingMode,
} from './constants';
import { Public, Roles } from './decorators';

describe('oidc decorators', () => {
  it('Public() sets unprotected=true and skip-auth=true', () => {
    class Dummy {
      @Public()
      handler() {}
    }

    const reflector = new Reflector();
    const instance = new Dummy();

    expect(reflector.get(META_UNPROTECTED, instance.handler)).toBe(true);
    expect(reflector.get(META_SKIP_AUTH, instance.handler)).toBe(true);
  });

  it('Public(false) sets skip-auth=false', () => {
    class Dummy {
      @Public(false)
      handler() {}
    }

    const reflector = new Reflector();
    const instance = new Dummy();

    expect(reflector.get(META_SKIP_AUTH, instance.handler)).toBe(false);
  });

  it('Roles({ roles: ["photographer"] }) sets roles metadata', () => {
    class Dummy {
      @Roles({ roles: ['photographer'] })
      handler() {}
    }

    const reflector = new Reflector();
    const instance = new Dummy();

    expect(reflector.get(META_ROLES, instance.handler)).toEqual({
      roles: ['photographer'],
    });
  });

  it('RoleMatchingMode.ALL is "all" and RoleMatchingMode.ANY is "any"', () => {
    expect(RoleMatchingMode.ALL).toBe('all');
    expect(RoleMatchingMode.ANY).toBe('any');
  });
});
