import { Module } from '@nestjs/common';
import { VietQrBasicStrategy } from './strategies/viet-qr.basic-strategy';
import { PassportModule } from '@nestjs/passport';
import { VietQrController } from './controllers/vietqr.controller';
import { SepayController } from './controllers/sepay.controller';
import { SepayService } from './services/sepay.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [PassportModule, DatabaseModule],
  providers: [VietQrBasicStrategy, SepayService],
  controllers: [VietQrController, SepayController],
})
export class PaymentModule {}
