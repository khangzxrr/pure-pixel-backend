import {
  ClientRepresentation,
  KeycloakAdminClient,
  RoleRepresentation,
  UserRepresentation,
} from '@s3pweb/keycloak-admin-client-cjs';
import { CreateKeycloakUserDto } from '../dtos/create-keycloak-user.dto';

import { UpdateKeycloakUserDto } from '../dtos/update-keycloak-user.dto';
import { Inject, Injectable } from '@nestjs/common';
import { CachingService } from 'src/caching/services/caching.service';

@Injectable()
export class KeycloakService {
  private kcInstance: KeycloakAdminClient;
  private clientInstance: ClientRepresentation;

  private refreshTokenDate: Date = new Date('2022-10-24');

  constructor(@Inject() private readonly cachingService: CachingService) {}

  private async clearCache() {
    await this.cachingService.deleteWithPattern(`findUsersHasRole:*`);
    await this.cachingService.deleteWithPattern(`findUsers:*`);
    await this.cachingService.deleteWithPattern(`getRole:*`);
    await this.cachingService.deleteWithPattern(`getUserRoles:*`);
  }

  private async getClient() {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const kc = await this.getInstance();

    const clientByIdResult = await kc.clients.find({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
    });

    this.clientInstance = clientByIdResult[0];

    return this.clientInstance;
  }

  private async refreshToken() {
    const now = new Date();

    const diff = now.getTime() - this.refreshTokenDate.getTime();
    const diffInMiniutes = diff / 1000 / 60;

    if (diffInMiniutes >= 10) {
      await this.kcInstance.auth({
        username: process.env.KEYCLOAK_REALM_ADMIN_USERNAME,
        password: process.env.KEYCLOAK_REALM_ADMIN_PASSWORD,
        grantType: 'password',
        clientId: process.env.KEYCLOAK_CLIENT_ID,
      });
    }
  }

  private async getInstance() {
    if (this.kcInstance) {
      await this.refreshToken();

      return this.kcInstance;
    }

    try {
      this.kcInstance = new KeycloakAdminClient({
        baseUrl: process.env.KEYCLOAK_AUTH_URL,
        realmName: process.env.KEYCLOAK_REALM,
      });

      await this.kcInstance.auth({
        username: process.env.KEYCLOAK_REALM_ADMIN_USERNAME,
        password: process.env.KEYCLOAK_REALM_ADMIN_PASSWORD,
        grantType: 'password',
        clientId: process.env.KEYCLOAK_CLIENT_ID,
      });

      this.refreshTokenDate = new Date('2023-10-24');

      return this.kcInstance;
    } catch (e) {
      console.log(e);
    }
  }

  async disableUserAndClearSession(id: string) {
    const instance = await this.getInstance();

    await instance.users.update(
      {
        id,
        realm: process.env.KEYCLOAK_REALM,
      },
      {
        enabled: false,
      },
    );

    await instance.users.logout({
      id,
      realm: process.env.KEYCLOAK_REALM,
    });

    await this.clearCache();
  }

  async enableUser(id: string) {
    const instance = await this.getInstance();

    await instance.users.update(
      {
        id,
        realm: process.env.KEYCLOAK_REALM,
      },
      {
        enabled: true,
      },
    );

    await this.clearCache();
  }

  async updateById(id: string, updateDto: UpdateKeycloakUserDto) {
    const instance = await this.getInstance();

    const user = await instance.users.update(
      {
        id,
        realm: process.env.KEYCLOAK_REALM,
      },
      {
        email: updateDto.mail,
        enabled: updateDto.enabled,
      },
    );

    if (updateDto.role) {
      await this.deleteRolesFromUser(id);
      await this.addRoleToUser(id, updateDto.role);
    }

    await this.clearCache();

    return user;
  }

  async create(createDto: CreateKeycloakUserDto) {
    const instance = await this.getInstance();

    const user = await instance.users.create({
      username: createDto.username,
      email: createDto.mail,
      emailVerified: true,
      enabled: true,
      credentials: [],
    });

    await this.addRoleToUser(user.id, createDto.role);

    await this.clearCache();

    return user;
  }

  async upsert(username: string, email: string, role: string, id?: string) {
    const instance = await this.getInstance();

    const existUser = await instance.users.find({
      username,
    });

    if (existUser.length !== 0) {
      console.log(`exist user with name ${username}`);
      return existUser[0];
    }

    const userPresentation: UserRepresentation = {
      username,
      email,
      emailVerified: true,
      enabled: true,
    };

    if (id) {
      userPresentation.id = id;
    }

    const user = await instance.users.create(userPresentation);

    await this.addRoleToUser(user.id, role);

    await this.clearCache();

    return user;
  }

  async getRole(roleName: string) {
    const cachedRole = await this.cachingService.get<RoleRepresentation>(
      `getRole:${roleName}`,
    );

    if (cachedRole) {
      return cachedRole;
    }

    const instance = await this.getInstance();
    const client = await this.getClient();

    const role = await instance.clients.findRole({
      id: client.id,
      roleName,
    });

    await this.cachingService.set(`getRole:${roleName}`, role);

    return role;
  }

  async isUserHasRole(userId: string, roleName: string) {
    const roles = await this.getUserRoles(userId);

    return roles.some((r) => r.name === roleName);
  }

  async getUserRoles(userId: string) {
    const cachedUserRoles = await this.cachingService.get<RoleRepresentation[]>(
      `getUserRoles:${userId}`,
    );
    if (cachedUserRoles) {
      return cachedUserRoles;
    }

    const instance = await this.getInstance();
    const client = await this.getClient();

    const roles = await instance.users.listClientRoleMappings({
      id: userId,
      clientUniqueId: client.id!,
    });

    await this.cachingService.set(`getUserRoles:${userId}`, roles);
    return roles;
  }

  async findFirst(id: string) {
    const kc = await this.getInstance();
    return kc.users.findOne({
      id,
    });
  }

  async deleteRolesFromUser(userId: string) {
    const roles = await this.getUserRoles(userId);

    for (const role of roles) {
      await this.deleteRoleFromUser(userId, role.name);
    }

    await this.clearCache();

    //forEach doesnt await => so we have to use manual for of loop
    // roles.forEach(async (role) => {
    //   console.log(role);
    // });
  }

  async deleteRoleFromUser(userId: string, roleName: string) {
    const kc = await this.getInstance();
    const client = await this.getClient();
    const role = await this.getRole(roleName);

    await kc.users.delClientRoleMappings({
      id: userId,
      clientUniqueId: client.id!,

      roles: [
        {
          id: role.id!,
          name: role.name!,
        },
      ],
    });

    await this.clearCache();
  }

  async addRoleToUser(userId: string, roleName: string) {
    const kc = await this.getInstance();
    const client = await this.getClient();
    const role = await this.getRole(roleName);

    await kc.users.addClientRoleMappings({
      id: userId,
      clientUniqueId: client.id!,

      roles: [
        {
          id: role.id!,
          name: role.name!,
        },
      ],
    });

    await this.clearCache();
  }

  async findUsersHasRole(roleName: string, skip: number, take: number) {
    const cachedUsers = await this.cachingService.get<UserRepresentation[]>(
      `findUsersHasRole:${roleName}:${skip}:${take}`,
    );

    if (cachedUsers) {
      return cachedUsers;
    }

    const kc = await this.getInstance();
    const client = await this.getClient();

    const users = await kc.clients.findUsersWithRole({
      id: client.id,
      roleName,
      max: take,
      first: skip,
    });

    await this.cachingService.set(
      `findUsersHasRole:${roleName}:${skip}:${take}`,
      users,
    );

    return users;
  }

  async countUsers() {
    const kc = await this.getInstance();

    return await kc.users.count({});
  }

  async findUsers(skip: number, take: number) {
    const cachedUsers = await this.cachingService.get<UserRepresentation[]>(
      `findUsers:${skip}:${take}`,
    );

    if (cachedUsers) {
      return cachedUsers;
    }

    const kc = await this.getInstance();
    const client = await this.getClient();

    const users = await kc.users.find({
      id: client.id,
      first: skip,
      max: take,
    });

    await this.cachingService.set(`findUsers:${skip}:${take}`, users);

    return users;
  }
}
