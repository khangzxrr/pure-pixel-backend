import {
  IdentityApiError,
  IdentityConflictError,
  IdentityService,
} from './identity.service';

type RawIdentityUser = {
  pk: number;
  uuid: string;
  username: string;
  email: string;
  is_active: boolean;
  date_joined: string;
  path: string;
  attributes: Record<string, unknown>;
  groups_obj: { pk: string; name: string }[];
};

const U: RawIdentityUser = {
  pk: 7,
  uuid: 'uuid-7',
  username: 'ann',
  email: 'a@x',
  is_active: true,
  date_joined: '2026-01-02T03:04:05Z',
  path: 'purepixel/users',
  attributes: { purepixel_id: 'kc-1' },
  groups_obj: [
    { pk: 'g-ph', name: 'purepixel:photographer' },
    { pk: 'g-nas', name: 'Camera viewers' },
  ],
};

const page = <T>(results: T[], next = 0, count = results.length) => ({
  pagination: { next, count },
  results,
});

type Route = {
  method?: string;
  test: (u: URL, init?: any) => boolean;
  respond: (u: URL, init?: any) => { status?: number; body?: unknown };
};

type RecordedCall = {
  url: string;
  method: string;
  headers: Record<string, string> | undefined;
  body: any;
};

function mockFetch(routes: Route[]): {
  fn: jest.Mock;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];

  const fn = jest.fn(async (url: string, init?: any) => {
    const u = new URL(url);
    const method = init?.method ?? 'GET';
    const body =
      typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;

    calls.push({ url, method, headers: init?.headers, body });

    const route = routes.find(
      (r) => (r.method ?? 'GET') === method && r.test(u, init),
    );

    if (!route) {
      throw new Error(`Unhandled fetch ${method} ${url}`);
    }

    const { status = 200, body: responseBody } = route.respond(u, init);

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseBody,
    } as unknown as Response;
  });

  return { fn, calls };
}

describe('IdentityService', () => {
  let cachingService: {
    get: jest.Mock;
    set: jest.Mock;
    deleteWithPattern: jest.Mock;
  };
  let service: IdentityService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTHENTIK_API_URL: 'http://ak/api/v3',
      AUTHENTIK_API_TOKEN: 'tok',
    };
    cachingService = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
      deleteWithPattern: jest.fn(),
    };
    service = new IdentityService(cachingService as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('sends the Authorization header on every request', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('path_startswith') === 'purepixel',
        respond: () => ({ body: page([], 0, 1) }),
      },
    ]);
    global.fetch = fn as any;

    await service.countUsers();

    expect(calls[0].headers?.Authorization).toBe('Bearer tok');
  });

  it('findFirst("kc-1") resolves the mapped user found by attributes search', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => {
          if (!u.pathname.endsWith('/core/users/')) return false;
          const attrs = u.searchParams.get('attributes');
          if (!attrs) return false;
          return JSON.parse(attrs).purepixel_id === 'kc-1';
        },
        respond: () => ({ body: page([U]) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.findFirst('kc-1');

    expect(result).toEqual({
      id: 'kc-1',
      username: 'ann',
      email: 'a@x',
      enabled: true,
      createdTimestamp: Date.parse('2026-01-02T03:04:05Z'),
    });
  });

  it('findFirst("uuid-9") falls back to a uuid search when attributes search is empty', async () => {
    const V: RawIdentityUser = {
      pk: 9,
      uuid: 'uuid-9',
      username: 'bob',
      email: 'bob@x',
      is_active: true,
      date_joined: '2026-02-01T00:00:00Z',
      path: 'purepixel/users',
      attributes: {},
      groups_obj: [],
    };
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') && u.searchParams.has('attributes'),
        respond: () => ({ body: page([]) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('uuid') === 'uuid-9',
        respond: () => ({ body: page([V]) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.findFirst('uuid-9');

    expect(result?.id).toBe('uuid-9');
  });

  it('findFirst("nope") resolves undefined when both searches are empty', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/'),
        respond: () => ({ body: page([]) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.findFirst('nope');

    expect(result).toBeUndefined();
  });

  it('findFirst returns a cached user without calling fetch', async () => {
    const cached = {
      id: 'kc-1',
      username: 'ann',
      email: 'a@x',
      enabled: true,
      createdTimestamp: 123,
    };
    cachingService.get.mockResolvedValue(cached);
    const fn = jest.fn();
    global.fetch = fn as any;

    const result = await service.findFirst('kc-1');

    expect(result).toEqual(cached);
    expect(fn).not.toHaveBeenCalled();
  });

  it('getUserRoles("kc-1") ignores non-prefixed groups', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/'),
        respond: () => ({ body: page([U]) }),
      },
    ]);
    global.fetch = fn as any;

    const roles = await service.getUserRoles('kc-1');

    expect(roles).toEqual([{ id: 'g-ph', name: 'photographer' }]);
  });

  it('isUserHasRole checks membership in the resolved roles', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/'),
        respond: () => ({ body: page([U]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(service.isUserHasRole('kc-1', 'photographer')).resolves.toBe(
      true,
    );
    await expect(service.isUserHasRole('kc-1', 'manager')).resolves.toBe(
      false,
    );
  });

  it('getRole("photographer") resolves the mapped role', async () => {
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/groups/') &&
          u.searchParams.get('name') === 'purepixel:photographer',
        respond: () => ({
          body: page([{ pk: 'g-ph', name: 'purepixel:photographer' }]),
        }),
      },
    ]);
    global.fetch = fn as any;

    const role = await service.getRole('photographer');

    expect(role).toEqual({ id: 'g-ph', name: 'photographer' });
  });

  it('getRole("ghost") rejects with an Error when no group is found', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/groups/'),
        respond: () => ({ body: page([]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(service.getRole('ghost')).rejects.toBeInstanceOf(Error);
  });

  it('addRoleToUser("kc-1","manager") posts to add_user and clears the findFirst cache', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/'),
        respond: () => ({ body: page([U]) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/groups/') &&
          u.searchParams.get('name') === 'purepixel:manager',
        respond: () => ({
          body: page([{ pk: 'g-mg', name: 'purepixel:manager' }]),
        }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/groups/g-mg/add_user/',
        respond: () => ({ status: 204 }),
      },
    ]);
    global.fetch = fn as any;

    await service.addRoleToUser('kc-1', 'manager');

    const addUserCall = calls.find((c) =>
      c.url.includes('/core/groups/g-mg/add_user/'),
    );
    expect(addUserCall?.body).toEqual({ pk: 7 });
    expect(cachingService.deleteWithPattern).toHaveBeenCalledWith(
      'findFirst:*',
    );
  });

  it('deleteRolesFromUser("kc-1") only removes the prefixed role', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/'),
        respond: () => ({ body: page([U]) }),
      },
      {
        method: 'POST',
        test: (u) => /\/core\/groups\/[^/]+\/remove_user\/$/.test(u.pathname),
        respond: () => ({ status: 204 }),
      },
    ]);
    global.fetch = fn as any;

    await service.deleteRolesFromUser('kc-1');

    const removeCalls = calls.filter((c) => c.url.includes('remove_user'));
    expect(removeCalls).toHaveLength(1);
    expect(removeCalls[0].url).toContain('/core/groups/g-ph/remove_user/');
    expect(removeCalls[0].body).toEqual({ pk: 7 });
  });

  it('addRoleToUser rejects for a non-purepixel (NAS) user and sends no request', async () => {
    const nasUser: RawIdentityUser = {
      pk: 20,
      uuid: 'uuid-20',
      username: 'nas1',
      email: 'nas1@x',
      is_active: true,
      date_joined: '2026-01-01T00:00:00Z',
      path: 'users',
      attributes: { purepixel_id: 'nas-id' },
      groups_obj: [],
    };
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/'),
        respond: () => ({ body: page([nasUser]) }),
      },
      {
        test: (u) => u.pathname.endsWith('/core/groups/'),
        respond: () => ({
          body: page([{ pk: 'g-mg', name: 'purepixel:manager' }]),
        }),
      },
    ]);
    global.fetch = fn as any;

    await expect(
      service.addRoleToUser('nas-id', 'manager'),
    ).rejects.toBeInstanceOf(Error);
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('create() adds the user and its role, resolving the sent purepixel_id', async () => {
    let createdBody: any;
    const { fn, calls } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('email') === 'b@x',
        respond: () => ({ body: page([]) }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/users/',
        respond: (_u, init) => {
          createdBody = JSON.parse(init.body);
          return {
            body: {
              pk: 8,
              uuid: 'uuid-8',
              username: createdBody.username,
              email: createdBody.email,
              is_active: createdBody.is_active,
              date_joined: '2026-03-01T00:00:00Z',
              path: createdBody.path,
              attributes: createdBody.attributes,
              groups_obj: [],
            },
          };
        },
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/groups/') &&
          u.searchParams.get('name') === 'purepixel:customer',
        respond: () => ({
          body: page([{ pk: 'g-cu', name: 'purepixel:customer' }]),
        }),
      },
      {
        test: (u) => {
          if (!u.pathname.endsWith('/core/users/')) return false;
          const attrs = u.searchParams.get('attributes');
          return !!attrs && JSON.parse(attrs).purepixel_id === createdBody?.attributes.purepixel_id;
        },
        respond: () => ({
          body: page([
            {
              pk: 8,
              uuid: 'uuid-8',
              username: createdBody.username,
              email: createdBody.email,
              is_active: createdBody.is_active,
              date_joined: '2026-03-01T00:00:00Z',
              path: createdBody.path,
              attributes: createdBody.attributes,
              groups_obj: [],
            },
          ]),
        }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/groups/g-cu/add_user/',
        respond: () => ({ status: 204 }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.create({
      username: 'bob',
      mail: 'b@x',
      role: 'customer',
    } as any);

    const createCall = calls.find(
      (c) => c.method === 'POST' && c.url.endsWith('/core/users/'),
    );
    expect(createCall?.body).toMatchObject({
      username: 'bob',
      email: 'b@x',
      is_active: true,
      type: 'external',
      path: 'purepixel/users',
    });
    expect(createCall?.body.attributes.purepixel_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.id).toBe(createCall?.body.attributes.purepixel_id);
  });

  it('create() rejects with IdentityConflictError when the email already exists', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('email') === 'b@x',
        respond: () => ({ body: page([U]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(
      service.create({ username: 'bob', mail: 'b@x', role: 'customer' } as any),
    ).rejects.toThrow(new IdentityConflictError('User exists with same email'));
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('create() rejects with IdentityConflictError when the username is taken', async () => {
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('email') === 'b@x',
        respond: () => ({ body: page([]) }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/users/',
        respond: () => ({
          status: 400,
          body: { username: ['This field must be unique.'] },
        }),
      },
    ]);
    global.fetch = fn as any;

    await expect(
      service.create({ username: 'bob', mail: 'b@x', role: 'customer' } as any),
    ).rejects.toThrow(
      new IdentityConflictError('User exists with same username'),
    );
  });

  it('upsert() returns the existing user without creating one', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('username') === 'ann',
        respond: () => ({ body: page([U]) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.upsert('ann', 'a@x', 'customer');

    expect(result.id).toBe('kc-1');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('upsert() creates a user with the given fixed id when none exists', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('username') === 'carl',
        respond: () => ({ body: page([]) }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/users/',
        respond: (_u, init) => {
          const body = JSON.parse(init.body);
          return {
            body: {
              pk: 30,
              uuid: 'uuid-30',
              username: body.username,
              email: body.email,
              is_active: body.is_active,
              date_joined: '2026-05-01T00:00:00Z',
              path: body.path,
              attributes: body.attributes,
              groups_obj: [],
            },
          };
        },
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/groups/') &&
          u.searchParams.get('name') === 'purepixel:photographer',
        respond: () => ({
          body: page([{ pk: 'g-ph', name: 'purepixel:photographer' }]),
        }),
      },
      {
        test: (u) => {
          if (!u.pathname.endsWith('/core/users/')) return false;
          const attrs = u.searchParams.get('attributes');
          return !!attrs && JSON.parse(attrs).purepixel_id === 'fixed-id';
        },
        respond: () => ({
          body: page([
            {
              pk: 30,
              uuid: 'uuid-30',
              username: 'carl',
              email: 'c@x',
              is_active: true,
              date_joined: '2026-05-01T00:00:00Z',
              path: 'purepixel/users',
              attributes: { purepixel_id: 'fixed-id' },
              groups_obj: [],
            },
          ]),
        }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/groups/g-ph/add_user/',
        respond: () => ({ status: 204 }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.upsert(
      'carl',
      'c@x',
      'photographer',
      'fixed-id',
    );

    const createCall = calls.find(
      (c) => c.method === 'POST' && c.url.endsWith('/core/users/'),
    );
    expect(createCall?.body.attributes.purepixel_id).toBe('fixed-id');
    expect(result.id).toBe('fixed-id');
  });

  it('updateById() patches email and enabled flag without touching roles', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/') && u.searchParams.has('attributes'),
        respond: () => ({ body: page([U]) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('email') === 'new@x',
        respond: () => ({ body: page([]) }),
      },
      {
        method: 'PATCH',
        test: (u) => u.pathname === '/api/v3/core/users/7/',
        respond: () => ({ body: { ...U, email: 'new@x', is_active: false } }),
      },
    ]);
    global.fetch = fn as any;

    await service.updateById('kc-1', { mail: 'new@x', enabled: false } as any);

    const patchCall = calls.find((c) => c.method === 'PATCH');
    expect(patchCall?.body).toEqual({ email: 'new@x', is_active: false });
    expect(calls.some((c) => c.url.includes('add_user'))).toBe(false);
    expect(calls.some((c) => c.url.includes('remove_user'))).toBe(false);
  });

  it('updateById() with a role change removes the old role and adds the new one', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/') && u.searchParams.has('attributes'),
        respond: () => ({ body: page([U]) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/groups/') &&
          u.searchParams.get('name') === 'purepixel:manager',
        respond: () => ({
          body: page([{ pk: 'g-mg', name: 'purepixel:manager' }]),
        }),
      },
      {
        method: 'POST',
        test: (u) => /\/core\/groups\/[^/]+\/remove_user\/$/.test(u.pathname),
        respond: () => ({ status: 204 }),
      },
      {
        method: 'POST',
        test: (u) => u.pathname === '/api/v3/core/groups/g-mg/add_user/',
        respond: () => ({ status: 204 }),
      },
      {
        method: 'PATCH',
        test: (u) => u.pathname === '/api/v3/core/users/7/',
        respond: () => ({ body: U }),
      },
    ]);
    global.fetch = fn as any;

    await service.updateById('kc-1', { role: 'manager' } as any);

    expect(
      calls.some((c) => c.url.includes('/core/groups/g-ph/remove_user/')),
    ).toBe(true);
    expect(
      calls.some((c) => c.url.includes('/core/groups/g-mg/add_user/')),
    ).toBe(true);
  });

  it('updateById() rejects with IdentityConflictError when the new email belongs to another user, without patching', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/') && u.searchParams.has('attributes'),
        respond: () => ({ body: page([U]) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('email') === 'taken@x',
        respond: () => ({ body: page([{ ...U, pk: 9 }]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(
      service.updateById('kc-1', { mail: 'taken@x' } as any),
    ).rejects.toThrow(new IdentityConflictError('User exists with same email'));
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('disableUserAndClearSession() disables the user and clears sessions and refresh tokens', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/') && u.searchParams.has('attributes'),
        respond: () => ({ body: page([U]) }),
      },
      {
        method: 'PATCH',
        test: (u) => u.pathname === '/api/v3/core/users/7/',
        respond: () => ({ body: { ...U, is_active: false } }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/authenticated_sessions/') &&
          u.searchParams.get('user__username') === 'ann',
        respond: () => ({ body: page([{ uuid: 's1' }, { uuid: 's2' }]) }),
      },
      {
        method: 'DELETE',
        test: (u) =>
          u.pathname === '/api/v3/core/authenticated_sessions/s1/' ||
          u.pathname === '/api/v3/core/authenticated_sessions/s2/',
        respond: () => ({ status: 204 }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/oauth2/refresh_tokens/') &&
          u.searchParams.get('user') === '7',
        respond: () => ({ body: page([{ pk: 3 }]) }),
      },
      {
        method: 'DELETE',
        test: (u) => u.pathname === '/api/v3/oauth2/refresh_tokens/3/',
        respond: () => ({ status: 204 }),
      },
    ]);
    global.fetch = fn as any;

    await service.disableUserAndClearSession('kc-1');

    const patchCall = calls.find((c) => c.method === 'PATCH');
    expect(patchCall?.body).toEqual({ is_active: false });
    expect(
      calls.some(
        (c) =>
          c.method === 'DELETE' &&
          c.url === 'http://ak/api/v3/core/authenticated_sessions/s1/',
      ),
    ).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.method === 'DELETE' &&
          c.url === 'http://ak/api/v3/core/authenticated_sessions/s2/',
      ),
    ).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.method === 'DELETE' &&
          c.url === 'http://ak/api/v3/oauth2/refresh_tokens/3/',
      ),
    ).toBe(true);
  });

  it('enableUser() patches the user with is_active true', async () => {
    const { fn, calls } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/users/') && u.searchParams.has('attributes'),
        respond: () => ({ body: page([U]) }),
      },
      {
        method: 'PATCH',
        test: (u) => u.pathname === '/api/v3/core/users/7/',
        respond: () => ({ body: { ...U, is_active: true } }),
      },
    ]);
    global.fetch = fn as any;

    await service.enableUser('kc-1');

    const patchCall = calls.find((c) => c.method === 'PATCH');
    expect(patchCall?.body).toEqual({ is_active: true });
  });

  it('findUsersHasRole("photographer",0,-1) returns all users across pages', async () => {
    const V: RawIdentityUser = {
      pk: 11,
      uuid: 'uuid-v',
      username: 'vic',
      email: 'v@x',
      is_active: true,
      date_joined: '2026-04-01T00:00:00Z',
      path: 'purepixel/users',
      attributes: {},
      groups_obj: [],
    };
    const { fn, calls } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('groups_by_name') === 'purepixel:photographer' &&
          u.searchParams.get('page') === '1',
        respond: () => ({ body: page([U], 2, 2) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('groups_by_name') === 'purepixel:photographer' &&
          u.searchParams.get('page') === '2',
        respond: () => ({ body: page([V], 0, 2) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.findUsersHasRole('photographer', 0, -1);

    expect(result.map((r: { id: string }) => r.id)).toEqual(['kc-1', 'uuid-v']);
    expect(
      calls.every((c) => c.url.includes('groups_by_name=purepixel%3Aphotographer') || c.url.includes('groups_by_name=purepixel:photographer')),
    ).toBe(true);
  });

  it('findUsersHasRole("photographer",1,1) returns only the requested page slice', async () => {
    const V: RawIdentityUser = {
      pk: 11,
      uuid: 'uuid-v',
      username: 'vic',
      email: 'v@x',
      is_active: true,
      date_joined: '2026-04-01T00:00:00Z',
      path: 'purepixel/users',
      attributes: {},
      groups_obj: [],
    };
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('groups_by_name') === 'purepixel:photographer' &&
          u.searchParams.get('page') === '1',
        respond: () => ({ body: page([U], 2, 2) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('groups_by_name') === 'purepixel:photographer' &&
          u.searchParams.get('page') === '2',
        respond: () => ({ body: page([V], 0, 2) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.findUsersHasRole('photographer', 1, 1);

    expect(result.map((r: { id: string }) => r.id)).toEqual(['uuid-v']);
  });

  it('countUsers() resolves the pagination count for purepixel users', async () => {
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('path_startswith') === 'purepixel',
        respond: () => ({ body: page([], 0, 42) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.countUsers();

    expect(result).toBe(42);
  });

  it('findUsers(0,-1) returns all purepixel users across pages', async () => {
    const V: RawIdentityUser = {
      pk: 11,
      uuid: 'uuid-v',
      username: 'vic',
      email: 'v@x',
      is_active: true,
      date_joined: '2026-04-01T00:00:00Z',
      path: 'purepixel/users',
      attributes: {},
      groups_obj: [],
    };
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('path_startswith') === 'purepixel' &&
          u.searchParams.get('page') === '1',
        respond: () => ({ body: page([U], 2, 2) }),
      },
      {
        test: (u) =>
          u.pathname.endsWith('/core/users/') &&
          u.searchParams.get('path_startswith') === 'purepixel' &&
          u.searchParams.get('page') === '2',
        respond: () => ({ body: page([V], 0, 2) }),
      },
    ]);
    global.fetch = fn as any;

    const result = await service.findUsers(0, -1);

    expect(result.map((r: { id: string }) => r.id)).toEqual(['kc-1', 'uuid-v']);
  });

  it('isRegistrationAllowed() resolves true when the stage has an enrollment flow', async () => {
    const { fn } = mockFetch([
      {
        test: (u) =>
          u.pathname.endsWith('/stages/identification/') &&
          u.searchParams.get('name') === 'purepixel-identification',
        respond: () => ({ body: page([{ enrollment_flow: 'f-uuid' }]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(service.isRegistrationAllowed()).resolves.toBe(true);
  });

  it('isRegistrationAllowed() resolves false when enrollment_flow is null', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/stages/identification/'),
        respond: () => ({ body: page([{ enrollment_flow: null }]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(service.isRegistrationAllowed()).resolves.toBe(false);
  });

  it('isRegistrationAllowed() resolves false when there are no results', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/stages/identification/'),
        respond: () => ({ body: page([]) }),
      },
    ]);
    global.fetch = fn as any;

    await expect(service.isRegistrationAllowed()).resolves.toBe(false);
  });

  it('rejects with IdentityApiError carrying the response status on a 500 response', async () => {
    const { fn } = mockFetch([
      {
        test: (u) => u.pathname.endsWith('/core/groups/'),
        respond: () => ({ status: 500, body: { detail: 'boom' } }),
      },
    ]);
    global.fetch = fn as any;

    let caught: unknown;
    try {
      await service.getRole('x');
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(IdentityApiError);
    expect((caught as IdentityApiError).status).toBe(500);
  });
});
