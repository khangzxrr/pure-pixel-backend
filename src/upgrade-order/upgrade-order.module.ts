import { Module } from '@nestjs/common';
import { UpgradeOrderController } from './controllers/upgrade-order.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationModule } from 'src/notification/notification.module';
import { PaymentModule } from 'src/payment/payment.module';
import { QueueModule } from 'src/queue/queue.module';
import { StorageModule } from 'src/storage/storage.module';
import { UpgradeServiceConsumer } from './consumers/upgrade-service.consumer';
import { ClearExpiredUpgradeOrder } from './services/clear-expired-upgrade-order.cron.service';
import { UpgradeOrderService } from './services/upgrade-order.service';

@Module({
  imports: [
    DatabaseModule,
    AuthenModule,
    StorageModule,
    QueueModule,
    NotificationModule,
    PaymentModule,
  ],
  providers: [
    UpgradeOrderService,
    ClearExpiredUpgradeOrder,
    UpgradeServiceConsumer,
  ],
  exports: [UpgradeOrderService],
  controllers: [UpgradeOrderController],
})
export class UpgradeOrderModule {}
