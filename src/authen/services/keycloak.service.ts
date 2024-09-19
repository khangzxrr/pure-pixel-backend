import {
  ClientRepresentation,
  KeycloakAdminClient,
} from '@s3pweb/keycloak-admin-client-cjs';

export class KeycloakService {
  kcInstance: KeycloakAdminClient;
  clientInstance: ClientRepresentation;

  async getClient() {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const kc = await this.getInstance();

    const clientByIdResult = await kc.clients.find({
      clientId: 'purepixel',
    });

    this.clientInstance = clientByIdResult[0];

    return this.clientInstance;
  }

  async getInstance() {
    if (this.kcInstance) {
      return this.kcInstance;
    }

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

    return this.kcInstance;
  }

  async getRole(roleName: string) {
    const instance = await this.getInstance();
    const client = await this.getClient();

    return await instance.clients.findRole({
      id: client.id,
      roleName,
    });
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
}
