import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { PushNotificationConsumer } from './consumers/push-notification.consumer';

@Module({
  providers: [NotificationService, PushNotificationConsumer],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
