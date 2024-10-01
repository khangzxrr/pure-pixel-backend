import { Module } from '@nestjs/common';
import { VietQrBasicStrategy } from './strategies/viet-qr.basic-strategy';
import { VietQrController } from './controllers/vietqr.controller';
import { SepayController } from './controllers/sepay.controller';
import { SepayService } from './services/sepay.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuthenModule } from 'src/authen/authen.module';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './controllers/transaction.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule],
  providers: [VietQrBasicStrategy, SepayService, TransactionService],
  exports: [SepayService],
  controllers: [VietQrController, SepayController, TransactionController],
})
export class PaymentModule {}
