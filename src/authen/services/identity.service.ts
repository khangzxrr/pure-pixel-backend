import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CachingService } from 'src/caching/services/caching.service';
import { CreateKeycloakUserDto } from '../dtos/create-keycloak-user.dto';
import { UpdateKeycloakUserDto } from '../dtos/update-keycloak-user.dto';

//a purepixel user of the identity provider, independent of the provider itself
export type IdentityUser = {
  id: string;
  username: string;
  email?: string;
  enabled: boolean;
  createdTimestamp?: number;
};

export type IdentityRole = {
  id: string;
  name: string;
};

//the identity provider already knows a user with the same username or email
export class IdentityConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityConflictError';
  }
}

//any non 2xx answer of the authentik API
export class IdentityApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`authentik api responded with status ${status}`);
    this.name = 'IdentityApiError';
  }
}

//authentik user as returned by /core/users/
type AuthentikUser = {
  pk: number;
  uuid: string;
  username: string;
  email?: string;
  is_active: boolean;
  date_joined: string;
  path: string;
  attributes?: Record<string, unknown> | null;
  groups_obj?: { pk: string; name: string }[] | null;
};

type AuthentikGroup = {
  pk: string;
  name: string;
};

type AuthentikPage<T> = {
  pagination: { next: number; count: number };
  results: T[];
};

//purepixel users live under this path, every other account of the instance is off limits
const PUREPIXEL_PATH_PREFIX = 'purepixel';
const PUREPIXEL_USER_PATH = 'purepixel/users';
//purepixel roles are modelled as groups with this prefix
const ROLE_GROUP_PREFIX = 'purepixel:';
const PAGE_SIZE = 100;

@Injectable()
export class IdentityService {
  constructor(@Inject() private readonly cachingService: CachingService) {}

  private get apiUrl(): string {
    return process.env.AUTHENTIK_API_URL as string;
  }

  private get apiToken(): string {
    return process.env.AUTHENTIK_API_TOKEN as string;
  }

  private async clearCache() {
    await this.cachingService.deleteWithPattern(`findUsersHasRole:*`);
    await this.cachingService.deleteWithPattern(`findUsers:*`);
    await this.cachingService.deleteWithPattern(`getRole:*`);
    await this.cachingService.deleteWithPattern(`getUserRoles:*`);
    await this.cachingService.deleteWithPattern(`findFirst:*`);
  }

  private async request<T>(
    path: string,
    init?: { method?: string; body?: unknown },
  ): Promise<T | undefined> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (!response.ok) {
      let body: unknown;

      try {
        body = await response.json();
      } catch {
        body = undefined;
      }

      throw new IdentityApiError(response.status, body);
    }

    if (response.status === 204) {
      return undefined;
    }

    return (await response.json()) as T;
  }

  //every list endpoint of authentik answers with the same paginated envelope
  private async listPage<T>(
    path: string,
    query: Record<string, string>,
  ): Promise<AuthentikPage<T>> {
    const search = new URLSearchParams(query).toString();

    const page = await this.request<AuthentikPage<T>>(`${path}?${search}`);

    return page ?? { pagination: { next: 0, count: 0 }, results: [] };
  }

  private async listAll<T>(
    path: string,
    query: Record<string, string>,
  ): Promise<T[]> {
    const all: T[] = [];
    let page = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await this.listPage<T>(path, {
        ...query,
        page_size: `${PAGE_SIZE}`,
        page: `${page}`,
      });

      all.push(...response.results);

      //authentik answers with next = 0 when the current page is the last one
      if (!response.pagination?.next) {
        break;
      }

      page = response.pagination.next;
    }

    return all;
  }

  private toIdentityUser(user: AuthentikUser): IdentityUser {
    return {
      id: this.toPurePixelId(user),
      username: user.username,
      email: user.email,
      enabled: user.is_active,
      createdTimestamp: user.date_joined
        ? Date.parse(user.date_joined)
        : undefined,
    };
  }

  //users migrated from keycloak keep their old id in attributes.purepixel_id
  private toPurePixelId(user: AuthentikUser): string {
    const attributeId = user.attributes?.purepixel_id;

    return typeof attributeId === 'string' && attributeId.length > 0
      ? attributeId
      : user.uuid;
  }

  private async findRawUser(id: string): Promise<AuthentikUser | undefined> {
    const byAttribute = await this.listPage<AuthentikUser>('/core/users/', {
      attributes: JSON.stringify({ purepixel_id: id }),
      include_groups: 'true',
    });

    if (byAttribute.results.length > 0) {
      return byAttribute.results[0];
    }

    const byUuid = await this.listPage<AuthentikUser>('/core/users/', {
      uuid: id,
      include_groups: 'true',
    });

    return byUuid.results[0];
  }

  private async loadPurePixelUser(id: string): Promise<AuthentikUser> {
    const user = await this.findRawUser(id);

    if (!user) {
      throw new Error(`identity user ${id} is not found`);
    }

    //the instance also holds accounts that do not belong to purepixel, never touch them
    if (!user.path?.startsWith(PUREPIXEL_PATH_PREFIX)) {
      throw new Error(`identity user ${id} is not a purepixel user`);
    }

    return user;
  }

  private toRoles(user: AuthentikUser): IdentityRole[] {
    return (user.groups_obj ?? [])
      .filter((group) => group.name.startsWith(ROLE_GROUP_PREFIX))
      .map((group) => ({
        id: group.pk,
        name: group.name.slice(ROLE_GROUP_PREFIX.length),
      }));
  }

  async findFirst(id: string): Promise<IdentityUser | undefined> {
    const cachedUser = await this.cachingService.get<IdentityUser>(
      `findFirst:${id}`,
    );

    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.findRawUser(id);

    if (!user) {
      return undefined;
    }

    const identityUser = this.toIdentityUser(user);

    await this.cachingService.set(`findFirst:${id}`, identityUser);

    return identityUser;
  }

  async getUserRoles(userId: string): Promise<IdentityRole[]> {
    const cachedUserRoles = await this.cachingService.get<IdentityRole[]>(
      `getUserRoles:${userId}`,
    );

    if (cachedUserRoles) {
      return cachedUserRoles;
    }

    const user = await this.findRawUser(userId);

    if (!user) {
      return [];
    }

    const roles = this.toRoles(user);

    await this.cachingService.set(`getUserRoles:${userId}`, roles);

    return roles;
  }

  async isUserHasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    return roles.some((r) => r.name === roleName);
  }

  async getRole(roleName: string): Promise<IdentityRole> {
    const cachedRole = await this.cachingService.get<IdentityRole>(
      `getRole:${roleName}`,
    );

    if (cachedRole) {
      return cachedRole;
    }

    const groups = await this.listPage<AuthentikGroup>('/core/groups/', {
      name: `${ROLE_GROUP_PREFIX}${roleName}`,
    });

    const group = groups.results[0];

    if (!group) {
      throw new Error(`identity role ${roleName} is not found`);
    }

    const role: IdentityRole = { id: group.pk, name: roleName };

    await this.cachingService.set(`getRole:${roleName}`, role);

    return role;
  }

  async addRoleToUser(userId: string, roleName: string) {
    const user = await this.loadPurePixelUser(userId);
    const role = await this.getRole(roleName);

    await this.request(`/core/groups/${role.id}/add_user/`, {
      method: 'POST',
      body: { pk: user.pk },
    });

    await this.clearCache();
  }

  async deleteRoleFromUser(userId: string, roleName: string) {
    const user = await this.loadPurePixelUser(userId);
    const role = await this.getRole(roleName);

    await this.request(`/core/groups/${role.id}/remove_user/`, {
      method: 'POST',
      body: { pk: user.pk },
    });

    await this.clearCache();
  }

  async deleteRolesFromUser(userId: string) {
    const user = await this.loadPurePixelUser(userId);

    //the group primary keys are already known, no extra lookup is needed
    for (const role of this.toRoles(user)) {
      await this.request(`/core/groups/${role.id}/remove_user/`, {
        method: 'POST',
        body: { pk: user.pk },
      });
    }

    await this.clearCache();
  }

  private async createUser(
    username: string,
    email: string,
    purepixelId: string,
  ): Promise<AuthentikUser> {
    try {
      const created = await this.request<AuthentikUser>('/core/users/', {
        method: 'POST',
        body: {
          username,
          name: username,
          email,
          is_active: true,
          type: 'external',
          path: PUREPIXEL_USER_PATH,
          attributes: { purepixel_id: purepixelId },
        },
      });

      return created as AuthentikUser;
    } catch (e) {
      if (
        e instanceof IdentityApiError &&
        e.status === 400 &&
        typeof e.body === 'object' &&
        e.body !== null &&
        'username' in e.body
      ) {
        throw new IdentityConflictError('User exists with same username');
      }

      throw e;
    }
  }

  private async findUsersByEmail(email: string): Promise<AuthentikUser[]> {
    const users = await this.listPage<AuthentikUser>('/core/users/', {
      email,
    });

    return users.results;
  }

  async create(createDto: CreateKeycloakUserDto): Promise<IdentityUser> {
    const sameEmailUsers = await this.findUsersByEmail(createDto.mail);

    if (sameEmailUsers.length > 0) {
      throw new IdentityConflictError('User exists with same email');
    }

    const created = await this.createUser(
      createDto.username,
      createDto.mail,
      randomUUID(),
    );

    const identityUser = this.toIdentityUser(created);

    await this.addRoleToUser(identityUser.id, createDto.role);

    await this.clearCache();

    return identityUser;
  }

  async upsert(
    username: string,
    email: string,
    role: string,
    id?: string,
  ): Promise<IdentityUser> {
    const existUsers = await this.listPage<AuthentikUser>('/core/users/', {
      username,
    });

    if (existUsers.results.length !== 0) {
      console.log(`exist user with name ${username}`);

      return this.toIdentityUser(existUsers.results[0]);
    }

    const created = await this.createUser(username, email, id ?? randomUUID());

    const identityUser = this.toIdentityUser(created);

    await this.addRoleToUser(identityUser.id, role);

    await this.clearCache();

    return identityUser;
  }

  async updateById(
    id: string,
    updateDto: UpdateKeycloakUserDto,
  ): Promise<IdentityUser> {
    const user = await this.loadPurePixelUser(id);

    if (updateDto.mail) {
      const sameEmailUsers = await this.findUsersByEmail(updateDto.mail);

      if (sameEmailUsers.some((u) => u.pk !== user.pk)) {
        throw new IdentityConflictError('User exists with same email');
      }
    }

    const body: { email?: string; is_active?: boolean } = {};

    if (updateDto.mail !== undefined) {
      body.email = updateDto.mail;
    }

    if (updateDto.enabled !== undefined) {
      body.is_active = updateDto.enabled;
    }

    const updated = await this.request<AuthentikUser>(
      `/core/users/${user.pk}/`,
      {
        method: 'PATCH',
        body,
      },
    );

    if (updateDto.role) {
      await this.deleteRolesFromUser(id);
      await this.addRoleToUser(id, updateDto.role);
    }

    await this.clearCache();

    return this.toIdentityUser(updated ?? user);
  }

  async disableUserAndClearSession(id: string) {
    const user = await this.loadPurePixelUser(id);

    await this.request(`/core/users/${user.pk}/`, {
      method: 'PATCH',
      body: { is_active: false },
    });

    const sessions = await this.listAll<{ uuid: string }>(
      '/core/authenticated_sessions/',
      { user__username: user.username },
    );

    for (const session of sessions) {
      await this.request(`/core/authenticated_sessions/${session.uuid}/`, {
        method: 'DELETE',
      });
    }

    const refreshTokens = await this.listAll<{ pk: number }>(
      '/oauth2/refresh_tokens/',
      { user: `${user.pk}` },
    );

    for (const refreshToken of refreshTokens) {
      await this.request(`/oauth2/refresh_tokens/${refreshToken.pk}/`, {
        method: 'DELETE',
      });
    }

    await this.clearCache();
  }

  async enableUser(id: string) {
    const user = await this.loadPurePixelUser(id);

    await this.request(`/core/users/${user.pk}/`, {
      method: 'PATCH',
      body: { is_active: true },
    });

    await this.clearCache();
  }

  async findUsersHasRole(
    roleName: string,
    skip: number,
    take: number,
  ): Promise<IdentityUser[]> {
    const cacheKey = `findUsersHasRole:${roleName}:${skip}:${take}`;

    const cachedUsers = await this.cachingService.get<IdentityUser[]>(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.listAll<AuthentikUser>('/core/users/', {
      groups_by_name: `${ROLE_GROUP_PREFIX}${roleName}`,
    });

    const identityUsers = this.slice(
      users.map((u) => this.toIdentityUser(u)),
      skip,
      take,
    );

    await this.cachingService.set(cacheKey, identityUsers);

    return identityUsers;
  }

  async countUsers(): Promise<number> {
    const users = await this.listPage<AuthentikUser>('/core/users/', {
      path_startswith: PUREPIXEL_PATH_PREFIX,
      page_size: '1',
    });

    return users.pagination.count;
  }

  async findUsers(skip: number, take: number): Promise<IdentityUser[]> {
    const cacheKey = `findUsers:${skip}:${take}`;

    const cachedUsers = await this.cachingService.get<IdentityUser[]>(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.listAll<AuthentikUser>('/core/users/', {
      path_startswith: PUREPIXEL_PATH_PREFIX,
    });

    const identityUsers = this.slice(
      users.map((u) => this.toIdentityUser(u)),
      skip,
      take,
    );

    await this.cachingService.set(cacheKey, identityUsers);

    return identityUsers;
  }

  //the identification stage only offers self registration when it has an enrollment flow
  async isRegistrationAllowed(): Promise<boolean> {
    const stages = await this.listPage<{ enrollment_flow?: string | null }>(
      '/stages/identification/',
      {
        name:
          process.env.AUTHENTIK_IDENTIFICATION_STAGE ??
          'purepixel-identification',
      },
    );

    return !!stages.results[0]?.enrollment_flow;
  }

  private slice<T>(items: T[], skip: number, take: number): T[] {
    return take === -1 ? items.slice(skip) : items.slice(skip, skip + take);
  }
}
