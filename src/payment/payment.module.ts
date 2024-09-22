import { Module } from '@nestjs/common';
import { VietQrBasicStrategy } from './strategies/viet-qr.basic-strategy';
import { VietQrController } from './controllers/vietqr.controller';
import { SepayController } from './controllers/sepay.controller';
import { SepayService } from './services/sepay.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuthenModule } from 'src/authen/authen.module';

@Module({
  imports: [DatabaseModule, AuthenModule],
  providers: [VietQrBasicStrategy, SepayService],
  controllers: [VietQrController, SepayController],
})
export class PaymentModule {}
