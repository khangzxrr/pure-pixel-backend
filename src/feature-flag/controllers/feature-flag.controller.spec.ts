import { Logger } from '@nestjs/common';
import { IdentityService } from 'src/authen/services/identity.service';
import {
  FeatureFlagController,
  REGISTRATION_CACHE_MS,
} from './feature-flag.controller';

describe('FeatureFlagController', () => {
  const originalEnv = process.env;
  let keycloakService: { isRegistrationAllowed: jest.Mock };
  let controller: FeatureFlagController;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    keycloakService = {
      isRegistrationAllowed: jest.fn().mockResolvedValue(true),
    };
    controller = new FeatureFlagController(
      keycloakService as unknown as IdentityService,
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    [undefined, true],
    ['true', true],
    ['', true],
    ['false', false],
  ])('FEATURE_BOOKING=%p gives booking %p', async (value, expected) => {
    if (value === undefined) {
      delete process.env.FEATURE_BOOKING;
    } else {
      process.env.FEATURE_BOOKING = value;
    }

    await expect(controller.getFlags()).resolves.toMatchObject({
      booking: expected,
    });
  });

  it.each([true, false])(
    'mirrors the Keycloak registration setting (%p)',
    async (allowed) => {
      keycloakService.isRegistrationAllowed.mockResolvedValue(allowed);

      await expect(controller.getFlags()).resolves.toMatchObject({
        registration: allowed,
      });
    },
  );

  it('reuses the registration setting for a minute, then asks Keycloak again', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-19T00:00:00Z') });
    keycloakService.isRegistrationAllowed.mockResolvedValue(false);

    await controller.getFlags();
    await controller.getFlags();
    expect(keycloakService.isRegistrationAllowed).toHaveBeenCalledTimes(1);

    keycloakService.isRegistrationAllowed.mockResolvedValue(true);
    jest.setSystemTime(Date.now() + REGISTRATION_CACHE_MS + 1);

    await expect(controller.getFlags()).resolves.toMatchObject({
      registration: true,
    });
    expect(keycloakService.isRegistrationAllowed).toHaveBeenCalledTimes(2);
  });

  it('keeps registration on when Keycloak cannot be read, and retries after the cache expires', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-19T00:00:00Z') });
    keycloakService.isRegistrationAllowed
      .mockRejectedValueOnce(new Error('403 Forbidden'))
      .mockResolvedValueOnce(false);

    await expect(controller.getFlags()).resolves.toMatchObject({
      registration: true,
    });
    await controller.getFlags();
    expect(keycloakService.isRegistrationAllowed).toHaveBeenCalledTimes(1);

    jest.setSystemTime(Date.now() + REGISTRATION_CACHE_MS + 1);
    await expect(controller.getFlags()).resolves.toMatchObject({
      registration: false,
    });
  });
});
