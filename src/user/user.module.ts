import { Module } from '@nestjs/common';
import { MeController } from './controllers/me.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { UserService } from './services/user.service';
import { UpgradeModule } from 'src/upgrade/upgrade.module';
import { WalletService } from './services/wallet.service';
import { WalletController } from './controllers/wallet.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { CachingModule } from 'src/caching/caching.module';

@Module({
  controllers: [MeController, WalletController],
  imports: [
    StorageModule,
    DatabaseModule,
    AuthenModule,
    UpgradeModule,
    PaymentModule,
    CachingModule,
  ],
  providers: [UserService, WalletService],
})
export class UserModule {}
