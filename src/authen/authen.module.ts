import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { AuthenService } from './services/authen.service';
import { KeycloakConfigService } from 'src/customConfig/services/keycloak-config.service';
import { CustomConfigModule } from 'src/customConfig/custom-config.module';

@Module({
  providers: [AuthenService],
  exports: [KeycloakConnectModule],
  imports: [
    DatabaseModule,
    CustomConfigModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [CustomConfigModule],
    }),
  ],
})
export class AuthenModule {}
