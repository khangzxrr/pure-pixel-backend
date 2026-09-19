import { PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';
import { BullMqConfigService } from './bullmq-config.service';
import { BullMqQueueRegisterService } from './bullmq-queue-register.service';
import { KeycloakConfigService } from './keycloak-config.service';

describe('custom config services', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      REDIS_HOSTNAME: 'redis-host',
      REDIS_PORT: '6380',
      KEYCLOAK_AUTH_URL: 'http://keycloak',
      KEYCLOAK_REALM: 'realm',
      KEYCLOAK_CLIENT_ID: 'client',
      KEYCLOAK_SECRET_KEY: 'secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('BullMqConfigService should build the shared connection', () => {
    expect(new BullMqConfigService().createSharedConfiguration()).toEqual({
      connection: { host: 'redis-host', port: 6380 },
    });
  });

  it('BullMqQueueRegisterService should build queue options', () => {
    expect(
      new BullMqQueueRegisterService().createRegisterQueueOptions(),
    ).toEqual({
      connection: { host: 'redis-host', port: 6380 },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
  });

  it('KeycloakConfigService should build keycloak options', () => {
    expect(new KeycloakConfigService().createKeycloakConnectOptions()).toEqual({
      authServerUrl: 'http://keycloak',
      realm: 'realm',
      clientId: 'client',
      secret: 'secret',
      logLevels: ['log'],
      useNestLogger: false,
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
      tokenValidation: TokenValidation.OFFLINE,
    });
  });
});
