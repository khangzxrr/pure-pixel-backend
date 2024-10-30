import {
  ClientRepresentation,
  KeycloakAdminClient,
} from '@s3pweb/keycloak-admin-client-cjs';

export class KeycloakService {
  private kcInstance: KeycloakAdminClient;
  private clientInstance: ClientRepresentation;

  private refreshTokenDate: Date = new Date('2022-10-24');

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

  async createUser(username: string, role: string) {
    const instance = await this.getInstance();

    const existUser = await instance.users.find({
      username,
    });

    if (existUser.length !== 0) {
      return existUser[0];
    }

    const user = await instance.users.create({
      username,
      email: `${username}@gmail.com`,
      emailVerified: true,
      enabled: true,
      firstName: username,
      lastName: username,
      credentials: [
        {
          type: 'password',
          value: username,
          temporary: false,
        },
      ],
    });

    await this.addRoleToUser(user.id, role);

    return user;
  }

  async getRole(roleName: string) {
    const instance = await this.getInstance();
    const client = await this.getClient();

    return await instance.clients.findRole({
      id: client.id,
      roleName,
    });
  }

  async isUserHasRole(userId: string, roleName: string) {
    const roles = await this.getUserRoles(userId);

    return roles.some((r) => r.name === roleName);
  }

  async getUserRoles(userId: string) {
    const instance = await this.getInstance();
    const client = await this.getClient();

    return instance.users.listClientRoleMappings({
      id: userId,
      clientUniqueId: client.id!,
    });
  }

  async deleteRoleFromUser(userId: string, roleName: string) {
    const kc = await this.getInstance();
    const client = await this.getClient();
    const role = await this.getRole(roleName);

    return kc.users.delClientRoleMappings({
      id: userId,
      clientUniqueId: client.id!,

      roles: [
        {
          id: role.id!,
          name: role.name!,
        },
      ],
    });
  }

  async addRoleToUser(userId: string, roleName: string) {
    const kc = await this.getInstance();
    const client = await this.getClient();
    const role = await this.getRole(roleName);

    return kc.users.addClientRoleMappings({
      id: userId,
      clientUniqueId: client.id!,

      roles: [
        {
          id: role.id!,
          name: role.name!,
        },
      ],
    });
  }

  async findUsersHasRole(roleName: string, skip: number, take: number) {
    const kc = await this.getInstance();
    const client = await this.getClient();

    const users = await kc.clients.findUsersWithRole({
      id: client.id,
      roleName,
      max: take,
      first: skip,
    });

    return users;
  }

  async findUsers(skip: number, take: number) {
    const kc = await this.getInstance();
    const client = await this.getClient();

    const users = await kc.users.find({
      id: client.id,
      first: skip,
      max: take,
    });

    return users;
  }
}
