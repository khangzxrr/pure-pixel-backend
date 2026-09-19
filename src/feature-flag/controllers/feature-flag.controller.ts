import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { FeatureFlagsDto } from '../dtos/feature-flags.dto';

//a flag is on unless its env variable is exactly "false", so a missing variable keeps the feature
const isEnabled = (name: string) => process.env[name] !== 'false';

@Controller('feature-flags')
@ApiTags('feature-flags')
export class FeatureFlagController {
  @Get()
  @ApiOperation({ summary: 'feature flags read by the frontend at startup' })
  @ApiOkResponse({ type: FeatureFlagsDto })
  @Public(true)
  getFlags(): FeatureFlagsDto {
    return { booking: isEnabled('FEATURE_BOOKING') };
  }
}
