import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/authen/oidc';
import { IdentityService } from 'src/authen/services/identity.service';
import { FeatureFlagsDto } from '../dtos/feature-flags.dto';

//a flag is on unless its env variable is exactly "false", so a missing variable keeps the feature
const isEnabled = (name: string) => process.env[name] !== 'false';

//how long the Keycloak registration setting is reused before asking Keycloak again
export const REGISTRATION_CACHE_MS = 60_000;

@Controller('feature-flags')
@ApiTags('feature-flags')
export class FeatureFlagController {
  private readonly logger = new Logger(FeatureFlagController.name);
  private registrationCache?: { value: boolean; expiresAt: number };

  constructor(private readonly keycloakService: IdentityService) {}

  @Get()
  @ApiOperation({ summary: 'feature flags read by the frontend at startup' })
  @ApiOkResponse({ type: FeatureFlagsDto })
  @Public(true)
  async getFlags(): Promise<FeatureFlagsDto> {
    return {
      booking: isEnabled('FEATURE_BOOKING'),
      registration: await this.isRegistrationAllowed(),
    };
  }

  //follows the Keycloak realm "User registration" switch; when Keycloak cannot be read the
  //register button stays visible (fail open) until the cache expires, then Keycloak is asked again
  private async isRegistrationAllowed(): Promise<boolean> {
    const now = Date.now();
    if (this.registrationCache && this.registrationCache.expiresAt > now) {
      return this.registrationCache.value;
    }

    let value = true;
    try {
      value = await this.keycloakService.isRegistrationAllowed();
    } catch (error) {
      this.logger.warn(
        `cannot read the Keycloak registration setting: ${error}`,
      );
    }
    this.registrationCache = { value, expiresAt: now + REGISTRATION_CACHE_MS };
    return value;
  }
}
