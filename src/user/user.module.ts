import { Module } from '@nestjs/common';
import { MeController } from './controllers/me.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { UserService } from './services/user.service';
import { WalletController } from './controllers/wallet.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { CachingModule } from 'src/caching/caching.module';
import { UpgradeOrderModule } from 'src/upgrade-order/upgrade-order.module';
import { UserController } from './controllers/user.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  controllers: [MeController, WalletController, UserController],
  imports: [
    StorageModule,
    DatabaseModule,
    AuthenModule,
    UpgradeOrderModule,
    PaymentModule,
    CachingModule,
    NestjsFormDataModule,
  ],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
