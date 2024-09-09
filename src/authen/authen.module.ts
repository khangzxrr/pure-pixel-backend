import { Module } from '@nestjs/common';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { KeycloakConfigService } from 'src/customConfig/services/keycloak-config.service';
import { CustomConfigModule } from 'src/customConfig/custom-config.module';

@Module({
  providers: [],
  exports: [KeycloakConnectModule],
  imports: [
    CustomConfigModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [CustomConfigModule],
    }),
  ],
})
export class AuthenModule {}
