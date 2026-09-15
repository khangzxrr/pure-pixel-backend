import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { CachingService } from 'src/caching/services/caching.service';
import { KeycloakService } from './keycloak.service';

jest.mock('@s3pweb/keycloak-admin-client-cjs', () => ({
  KeycloakAdminClient: jest.fn(),
}));

const KeycloakAdminClientMock = KeycloakAdminClient as unknown as jest.Mock;

type KcMock = {
  auth: jest.Mock;
  clients: {
    find: jest.Mock;
    findRole: jest.Mock;
    findUsersWithRole: jest.Mock;
  };
  users: {
    update: jest.Mock;
    logout: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    listClientRoleMappings: jest.Mock;
    delClientRoleMappings: jest.Mock;
    addClientRoleMappings: jest.Mock;
    count: jest.Mock;
  };
};

describe('KeycloakService', () => {
  const originalEnv = process.env;
  let kc: KcMock;
  let cachingService: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    deleteWithPattern: jest.Mock;
  };
  let service: KeycloakService;

  const cachePatterns = [
    'findUsersHasRole:*',
    'findUsers:*',
    'getRole:*',
    'getUserRoles:*',
    'findFirst:*',
  ];

  const expectCacheCleared = () => {
    for (const pattern of cachePatterns) {
      expect(cachingService.deleteWithPattern).toHaveBeenCalledWith(pattern);
    }
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      KEYCLOAK_AUTH_URL: 'https://kc.example.com',
      KEYCLOAK_REALM: 'purepixel',
      KEYCLOAK_REALM_ADMIN_USERNAME: 'admin',
      KEYCLOAK_REALM_ADMIN_PASSWORD: 'admin-pw',
      KEYCLOAK_CLIENT_ID: 'backend',
    };

    // before refreshTokenDate (2023-10-24) so no token refresh happens unless a test moves the clock
    jest.useFakeTimers({ now: new Date('2023-10-24T00:05:00.000Z') });

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    kc = {
      auth: jest.fn().mockResolvedValue(undefined),
      clients: {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 'client-uuid', clientId: 'backend' }]),
        findRole: jest.fn(),
        findUsersWithRole: jest.fn(),
      },
      users: {
        update: jest.fn(),
        logout: jest.fn(),
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        listClientRoleMappings: jest.fn(),
        delClientRoleMappings: jest.fn(),
        addClientRoleMappings: jest.fn(),
        count: jest.fn(),
      },
    };
    KeycloakAdminClientMock.mockReset();
    KeycloakAdminClientMock.mockImplementation(() => kc);

    cachingService = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn(),
      deleteWithPattern: jest.fn().mockResolvedValue(undefined),
    };

    service = new KeycloakService(cachingService as unknown as CachingService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('admin client instance', () => {
    it('creates and authenticates the admin client on first use', async () => {
      kc.users.count.mockResolvedValue(3);

      await expect(service.countUsers()).resolves.toBe(3);

      expect(KeycloakAdminClientMock).toHaveBeenCalledWith({
        baseUrl: 'https://kc.example.com',
        realmName: 'purepixel',
      });
      expect(kc.auth).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin-pw',
        grantType: 'password',
        clientId: 'backend',
      });
      expect(kc.users.count).toHaveBeenCalledWith({});
    });

    it('reuses the instance without re-authenticating within 10 minutes', async () => {
      kc.users.count.mockResolvedValue(1);

      await service.countUsers();
      await service.countUsers();

      expect(KeycloakAdminClientMock).toHaveBeenCalledTimes(1);
      expect(kc.auth).toHaveBeenCalledTimes(1);
    });

    it('re-authenticates the existing instance when the token is older than 10 minutes', async () => {
      kc.users.count.mockResolvedValue(1);

      await service.countUsers();
      jest.setSystemTime(new Date('2023-10-24T00:10:00.000Z'));
      await service.countUsers();

      expect(KeycloakAdminClientMock).toHaveBeenCalledTimes(1);
      expect(kc.auth).toHaveBeenCalledTimes(2);
      expect(kc.auth).toHaveBeenLastCalledWith({
        username: 'admin',
        password: 'admin-pw',
        grantType: 'password',
        clientId: 'backend',
      });
    });

    it('throws when the admin client cannot authenticate', async () => {
      const authError = new Error('invalid credentials');
      kc.auth.mockRejectedValue(authError);

      await expect(service.countUsers()).rejects.toThrow(
        'keycloak admin client is not available',
      );
      expect(console.log).toHaveBeenCalledWith(authError);
      expect(kc.users.count).not.toHaveBeenCalled();
    });
  });

  describe('client lookup', () => {
    it('looks up the client once and caches it', async () => {
      kc.clients.findRole.mockResolvedValue({ id: 'r', name: 'role' });

      await service.getRole('a');
      await service.getRole('b');

      expect(kc.clients.find).toHaveBeenCalledTimes(1);
      expect(kc.clients.find).toHaveBeenCalledWith({ clientId: 'backend' });
      expect(kc.clients.findRole).toHaveBeenCalledWith({
        id: 'client-uuid',
        roleName: 'b',
      });
    });

    it('throws when the client is not found', async () => {
      kc.clients.find.mockResolvedValue([]);

      await expect(service.getRole('a')).rejects.toThrow(
        'keycloak client backend is not found',
      );
    });

    it('throws when the found client has no id', async () => {
      kc.clients.find.mockResolvedValue([{ clientId: 'backend' }]);

      await expect(service.getRole('a')).rejects.toThrow(
        'keycloak client backend is not found',
      );
    });
  });

  it('disableUserAndClearSession disables the user, logs out and clears cache', async () => {
    await service.disableUserAndClearSession('u1');

    expect(kc.users.update).toHaveBeenCalledWith(
      { id: 'u1', realm: 'purepixel' },
      { enabled: false },
    );
    expect(kc.users.logout).toHaveBeenCalledWith({
      id: 'u1',
      realm: 'purepixel',
    });
    expectCacheCleared();
  });

  it('enableUser enables the user and clears cache', async () => {
    await service.enableUser('u1');

    expect(kc.users.update).toHaveBeenCalledWith(
      { id: 'u1', realm: 'purepixel' },
      { enabled: true },
    );
    expect(kc.users.logout).not.toHaveBeenCalled();
    expectCacheCleared();
  });

  describe('updateById', () => {
    it('updates mail and enabled without touching roles when no role is given', async () => {
      kc.users.update.mockResolvedValue({ updated: true });

      await expect(
        service.updateById('u1', { mail: 'a@b.c', enabled: true, role: '' }),
      ).resolves.toEqual({ updated: true });

      expect(kc.users.update).toHaveBeenCalledWith(
        { id: 'u1', realm: 'purepixel' },
        { email: 'a@b.c', enabled: true },
      );
      expect(kc.users.listClientRoleMappings).not.toHaveBeenCalled();
      expect(kc.users.addClientRoleMappings).not.toHaveBeenCalled();
      expectCacheCleared();
    });

    it('replaces the roles when a role is given', async () => {
      kc.users.listClientRoleMappings.mockResolvedValue([
        { id: 'old-id', name: 'customer' },
      ]);
      kc.clients.findRole.mockImplementation(({ roleName }) =>
        Promise.resolve({ id: `${roleName}-id`, name: roleName }),
      );

      await service.updateById('u1', {
        mail: 'a@b.c',
        enabled: false,
        role: 'photographer',
      });

      expect(kc.users.delClientRoleMappings).toHaveBeenCalledWith({
        id: 'u1',
        clientUniqueId: 'client-uuid',
        roles: [{ id: 'customer-id', name: 'customer' }],
      });
      expect(kc.users.addClientRoleMappings).toHaveBeenCalledWith({
        id: 'u1',
        clientUniqueId: 'client-uuid',
        roles: [{ id: 'photographer-id', name: 'photographer' }],
      });
    });
  });

  it('create creates an enabled verified user with the role', async () => {
    kc.users.create.mockResolvedValue({ id: 'new-id' });
    kc.clients.findRole.mockResolvedValue({ id: 'role-id', name: 'customer' });

    await expect(
      service.create({ username: 'john', mail: 'j@m.c', role: 'customer' }),
    ).resolves.toEqual({ id: 'new-id' });

    expect(kc.users.create).toHaveBeenCalledWith({
      username: 'john',
      email: 'j@m.c',
      emailVerified: true,
      enabled: true,
      credentials: [],
    });
    expect(kc.users.addClientRoleMappings).toHaveBeenCalledWith({
      id: 'new-id',
      clientUniqueId: 'client-uuid',
      roles: [{ id: 'role-id', name: 'customer' }],
    });
    expectCacheCleared();
  });

  describe('upsert', () => {
    it('returns the existing user without creating', async () => {
      const existing = { id: 'e1', username: 'john' };
      kc.users.find.mockResolvedValue([existing]);

      await expect(service.upsert('john', 'j@m.c', 'customer')).resolves.toBe(
        existing,
      );

      expect(kc.users.find).toHaveBeenCalledWith({ username: 'john' });
      expect(kc.users.create).not.toHaveBeenCalled();
    });

    it('creates the user with the given id and adds the role', async () => {
      kc.users.find.mockResolvedValue([]);
      kc.users.create.mockResolvedValue({ id: 'fixed-id' });
      kc.clients.findRole.mockResolvedValue({
        id: 'role-id',
        name: 'customer',
      });

      await expect(
        service.upsert('john', 'j@m.c', 'customer', 'fixed-id'),
      ).resolves.toEqual({ id: 'fixed-id' });

      expect(kc.users.create).toHaveBeenCalledWith({
        id: 'fixed-id',
        username: 'john',
        email: 'j@m.c',
        emailVerified: true,
        enabled: true,
      });
      expect(kc.users.addClientRoleMappings).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'fixed-id' }),
      );
      expectCacheCleared();
    });

    it('creates the user without an id when none is given', async () => {
      kc.users.find.mockResolvedValue([]);
      kc.users.create.mockResolvedValue({ id: 'generated' });
      kc.clients.findRole.mockResolvedValue({
        id: 'role-id',
        name: 'customer',
      });

      await service.upsert('john', 'j@m.c', 'customer');

      expect(kc.users.create).toHaveBeenCalledWith({
        username: 'john',
        email: 'j@m.c',
        emailVerified: true,
        enabled: true,
      });
    });
  });

  describe('getRole', () => {
    it('returns the cached role', async () => {
      const role = { id: 'r', name: 'customer' };
      cachingService.get.mockResolvedValue(role);

      await expect(service.getRole('customer')).resolves.toBe(role);
      expect(cachingService.get).toHaveBeenCalledWith('getRole:customer');
      expect(KeycloakAdminClientMock).not.toHaveBeenCalled();
    });

    it('fetches and caches the role on cache miss', async () => {
      const role = { id: 'r', name: 'customer' };
      kc.clients.findRole.mockResolvedValue(role);

      await expect(service.getRole('customer')).resolves.toBe(role);
      expect(cachingService.set).toHaveBeenCalledWith('getRole:customer', role);
    });
  });

  describe('getUserRoles / isUserHasRole', () => {
    it('returns cached roles', async () => {
      const roles = [{ name: 'customer' }];
      cachingService.get.mockResolvedValue(roles);

      await expect(service.getUserRoles('u1')).resolves.toBe(roles);
      expect(cachingService.get).toHaveBeenCalledWith('getUserRoles:u1');
      expect(kc.users.listClientRoleMappings).not.toHaveBeenCalled();
    });

    it('fetches and caches the client role mappings on cache miss', async () => {
      const roles = [{ name: 'customer' }];
      kc.users.listClientRoleMappings.mockResolvedValue(roles);

      await expect(service.getUserRoles('u1')).resolves.toBe(roles);
      expect(kc.users.listClientRoleMappings).toHaveBeenCalledWith({
        id: 'u1',
        clientUniqueId: 'client-uuid',
      });
      expect(cachingService.set).toHaveBeenCalledWith('getUserRoles:u1', roles);
    });

    it('isUserHasRole checks role names', async () => {
      cachingService.get.mockResolvedValue([
        { name: 'customer' },
        { name: 'manager' },
      ]);

      await expect(service.isUserHasRole('u1', 'manager')).resolves.toBe(true);
      await expect(service.isUserHasRole('u1', 'photographer')).resolves.toBe(
        false,
      );
    });
  });

  describe('findFirst', () => {
    it('returns the cached user', async () => {
      const user = { id: 'u1' };
      cachingService.get.mockResolvedValue(user);

      await expect(service.findFirst('u1')).resolves.toBe(user);
      expect(cachingService.get).toHaveBeenCalledWith('findFirst:u1');
      expect(kc.users.findOne).not.toHaveBeenCalled();
    });

    it('fetches and caches the user on cache miss', async () => {
      const user = { id: 'u1' };
      kc.users.findOne.mockResolvedValue(user);

      await expect(service.findFirst('u1')).resolves.toBe(user);
      expect(kc.users.findOne).toHaveBeenCalledWith({ id: 'u1' });
      expect(cachingService.set).toHaveBeenCalledWith('findFirst:u1', user);
    });
  });

  describe('deleteRolesFromUser', () => {
    it('deletes every role of the user and clears cache', async () => {
      kc.users.listClientRoleMappings.mockResolvedValue([
        { id: 'a', name: 'customer' },
        { id: 'b', name: 'photographer' },
      ]);
      kc.clients.findRole.mockImplementation(({ roleName }) =>
        Promise.resolve({ id: `${roleName}-id`, name: roleName }),
      );

      await service.deleteRolesFromUser('u1');

      expect(kc.users.delClientRoleMappings).toHaveBeenCalledTimes(2);
      expect(kc.users.delClientRoleMappings).toHaveBeenNthCalledWith(2, {
        id: 'u1',
        clientUniqueId: 'client-uuid',
        roles: [{ id: 'photographer-id', name: 'photographer' }],
      });
      expectCacheCleared();
    });

    it('does nothing but clearing cache when the user has no role', async () => {
      kc.users.listClientRoleMappings.mockResolvedValue([]);

      await service.deleteRolesFromUser('u1');

      expect(kc.users.delClientRoleMappings).not.toHaveBeenCalled();
      expectCacheCleared();
    });

    it('throws when a role mapping has no name', async () => {
      kc.users.listClientRoleMappings.mockResolvedValue([{ id: 'nameless' }]);

      await expect(service.deleteRolesFromUser('u1')).rejects.toThrow(
        'role nameless of user u1 has no name',
      );
      expect(kc.users.delClientRoleMappings).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['deleteRoleFromUser', 'delClientRoleMappings'] as const,
    ['addRoleToUser', 'addClientRoleMappings'] as const,
  ])('%s', (method, kcMethod) => {
    it('maps the role to the user and clears cache', async () => {
      kc.clients.findRole.mockResolvedValue({ id: 'role-id', name: 'manager' });

      await service[method]('u1', 'manager');

      expect(kc.users[kcMethod]).toHaveBeenCalledWith({
        id: 'u1',
        clientUniqueId: 'client-uuid',
        roles: [{ id: 'role-id', name: 'manager' }],
      });
      expectCacheCleared();
    });

    it('throws when the role is not found', async () => {
      kc.clients.findRole.mockResolvedValue(null);

      await expect(service[method]('u1', 'ghost')).rejects.toThrow(
        'keycloak role ghost is not found',
      );
      expect(kc.users[kcMethod]).not.toHaveBeenCalled();
    });

    it('throws when the role has no name', async () => {
      kc.clients.findRole.mockResolvedValue({ id: 'role-id' });

      await expect(service[method]('u1', 'ghost')).rejects.toThrow(
        'keycloak role ghost is not found',
      );
    });
  });

  describe('findUsersHasRole', () => {
    it('returns cached users', async () => {
      const users = [{ id: 'u1' }];
      cachingService.get.mockResolvedValue(users);

      await expect(
        service.findUsersHasRole('photographer', 0, 10),
      ).resolves.toBe(users);
      expect(cachingService.get).toHaveBeenCalledWith(
        'findUsersHasRole:photographer:0:10',
      );
      expect(kc.clients.findUsersWithRole).not.toHaveBeenCalled();
    });

    it('fetches and caches users with the role on cache miss', async () => {
      const users = [{ id: 'u1' }];
      kc.clients.findUsersWithRole.mockResolvedValue(users);

      await expect(
        service.findUsersHasRole('photographer', 5, 10),
      ).resolves.toBe(users);
      expect(kc.clients.findUsersWithRole).toHaveBeenCalledWith({
        id: 'client-uuid',
        roleName: 'photographer',
        max: 10,
        first: 5,
      });
      expect(cachingService.set).toHaveBeenCalledWith(
        'findUsersHasRole:photographer:5:10',
        users,
      );
    });
  });

  describe('findUsers', () => {
    it('returns cached users', async () => {
      const users = [{ id: 'u1' }];
      cachingService.get.mockResolvedValue(users);

      await expect(service.findUsers(0, 10)).resolves.toBe(users);
      expect(cachingService.get).toHaveBeenCalledWith('findUsers:0:10');
      expect(kc.users.find).not.toHaveBeenCalled();
    });

    it('fetches a page of users and caches it on cache miss', async () => {
      const users = [{ id: 'u1' }];
      kc.users.find.mockResolvedValue(users);

      await expect(service.findUsers(20, 10)).resolves.toBe(users);
      expect(kc.users.find).toHaveBeenCalledWith(
        expect.objectContaining({ first: 20, max: 10 }),
      );
      expect(cachingService.set).toHaveBeenCalledWith('findUsers:20:10', users);
    });
  });
});
