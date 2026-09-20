import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { FeatureFlagController } from './controllers/feature-flag.controller';

@Module({
  //AuthenModule exports IdentityService, which reads the realm registration setting
  imports: [AuthenModule],
  controllers: [FeatureFlagController],
})
export class FeatureFlagModule {}
