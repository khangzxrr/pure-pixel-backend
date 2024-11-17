import { Module } from '@nestjs/common';
import { VietQrBasicStrategy } from './strategies/viet-qr.basic-strategy';
import { SepayController } from './controllers/sepay.controller';
import { SepayService } from './services/sepay.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuthenModule } from 'src/authen/authen.module';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './controllers/transaction.controller';
import { StorageModule } from 'src/storage/storage.module';
import { PaymentCleanUpCronJob } from './cronjobs/payment-clean-up.service';
import { TransactionHandlerService } from './services/transaction-handler.service';
import { ManageTransactionController } from './controllers/manage-transaction.controller';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule],
  providers: [
    PaymentCleanUpCronJob,
    VietQrBasicStrategy,
    SepayService,
    TransactionHandlerService,
    TransactionService,
  ],
  exports: [SepayService],
  controllers: [
    SepayController,
    TransactionController,
    ManageTransactionController,
  ],
})
export class PaymentModule {}
