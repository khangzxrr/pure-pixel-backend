import { Module } from '@nestjs/common';
import { VietQrBasicStrategy } from './strategies/viet-qr.basic-strategy';
import { PassportModule } from '@nestjs/passport';
import { VietQrController } from './controllers/vietqr.controller';
import { SepayController } from './controllers/sepay.controller';

@Module({
  imports: [PassportModule],
  providers: [VietQrBasicStrategy],
  controllers: [VietQrController, SepayController],
})
export class PaymentModule {}
