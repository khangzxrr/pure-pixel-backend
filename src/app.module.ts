import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { PhotographerModule } from './photographer/photographer.module';
import { AuthenModule } from './authen/authen.module';
import { DatabaseModule } from './database/database.module';
import { PhotoModule } from './photo/photo.module';
import { NotificationModule } from './notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UpgradeModule } from './upgrade/upgrade.module';
import { PaymentModule } from './payment/payment.module';
import { QueueModule } from './queue/queue.module';

@Module({
  providers: [],
  exports: [],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StorageModule,
    AuthenModule,
    UserModule,
    PhotographerModule,
    DatabaseModule,
    PhotoModule,
    NotificationModule,
    UpgradeModule,
    PaymentModule,
    QueueModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
