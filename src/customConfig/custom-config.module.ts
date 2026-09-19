import { Module } from '@nestjs/common';
import { BullMqConfigService } from './services/bullmq-config.service';
import { BullMqQueueRegisterService } from './services/bullmq-queue-register.service';

@Module({
  providers: [BullMqConfigService, BullMqQueueRegisterService],
  exports: [BullMqConfigService, BullMqQueueRegisterService],
})
export class CustomConfigModule {}
