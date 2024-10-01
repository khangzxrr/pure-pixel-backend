import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UpgradeService } from './services/upgrade.service';
import { UpgradeController } from './controllers/upgrade.controller';
import { UpgradeOrderService } from './services/upgrade-order.service';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';
import { ClearExpiredUpgradeOrder } from './services/clear-expired-upgrade-order.cron.service';
import { QueueModule } from 'src/queue/queue.module';
import { UpgradeServiceConsumer } from './consumers/upgrade-service.consumer';
import { NotificationModule } from 'src/notification/notification.module';
import { PaymentModule } from 'src/payment/payment.module';

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
    UpgradeService,
    UpgradeOrderService,
    ClearExpiredUpgradeOrder,
    UpgradeServiceConsumer,
  ],
  exports: [UpgradeService, UpgradeOrderService],
  controllers: [UpgradeController],
})
export class UpgradeModule {}
