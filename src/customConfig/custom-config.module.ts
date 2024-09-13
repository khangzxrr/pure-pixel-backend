import { Module } from '@nestjs/common';
import { KeycloakConfigService } from './services/keycloak-config.service';
import { BullMqConfigService } from './services/bullmq-config.service';
import { BullMqQueueRegisterService } from './services/bullmq-queue-register.service';

@Module({
  providers: [
    KeycloakConfigService,
    BullMqConfigService,
    BullMqQueueRegisterService,
  ],
  exports: [
    KeycloakConfigService,
    BullMqConfigService,
    BullMqQueueRegisterService,
  ],
})
export class CustomConfigModule {}
