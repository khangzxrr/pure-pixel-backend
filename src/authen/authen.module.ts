import { Module } from '@nestjs/common';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { KeycloakConfigService } from 'src/customConfig/services/keycloak-config.service';
import { CustomConfigModule } from 'src/customConfig/custom-config.module';
import { KeycloakService } from './services/keycloak.service';

@Module({
  providers: [KeycloakService],
  exports: [KeycloakConnectModule, KeycloakService],
  imports: [
    CustomConfigModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [CustomConfigModule],
    }),
  ],
})
export class AuthenModule {}
