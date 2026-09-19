import { Module } from '@nestjs/common';
import { FeatureFlagController } from './controllers/feature-flag.controller';

@Module({
  controllers: [FeatureFlagController],
})
export class FeatureFlagModule {}
