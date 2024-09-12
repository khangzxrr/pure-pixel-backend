import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { UpgradeConstant } from 'src/upgrade/constants/upgrade.constant';

@Module({
  exports: [BullModule],
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: UpgradeConstant.UPGRADE_QUEUE,
    }),
  ],
})
export class QueueModule {}
