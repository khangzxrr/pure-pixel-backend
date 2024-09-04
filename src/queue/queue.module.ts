import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Constants } from 'src/infrastructure/utils/constants';

@Module({
  //this is important, or you will get dependency error
  exports: [BullModule],
  imports: [
    BullModule.forRoot({
      connection: {
        host: '172.17.0.1',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: Constants.IMAGE_PROCESS_QUEUE,
    }),
  ],
})
export class QueueModule {}
