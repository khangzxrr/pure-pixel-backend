import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CustomConfigModule } from 'src/customConfig/custom-config.module';
import { BullMqConfigService } from 'src/customConfig/services/bullmq-config.service';
import { BullMqQueueRegisterService } from 'src/customConfig/services/bullmq-queue-register.service';
import { PhotoConstant } from 'src/photo/constants/photo.constant';
import { UpgradeConstant } from 'src/upgrade/constants/upgrade.constant';

@Module({
  exports: [BullModule],
  imports: [
    //register bullMq and queue need to use async becuz there is a bug when deploy to server
    //queue doesnt use connection of forRootAsync, so we have to registerQueueAsync with provided connection too
    //it will work for every nodejs version and nestjs version too
    BullModule.forRootAsync({
      imports: [CustomConfigModule],
      useExisting: BullMqConfigService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: UpgradeConstant.UPGRADE_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
    BullModule.registerQueueAsync({
      imports: [CustomConfigModule],
      name: PhotoConstant.PHOTO_PROCESS_QUEUE,
      useExisting: BullMqQueueRegisterService,
      inject: [CustomConfigModule],
    }),
  ],
})
export class QueueModule {}
