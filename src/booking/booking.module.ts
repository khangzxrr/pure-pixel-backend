import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { BookingService } from './services/booking.service';
import { CustomerBookingController } from './controllers/customer-booking.controller';
import { PhotographerBookingController } from './controllers/photographer-booking.controller';
import { NotificationModule } from 'src/notification/notification.module';
import { BookingBillItemService } from './services/bill-item.service';
import { PhotoModule } from 'src/photo/photo.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    PhotoModule,
    AuthenModule,
    NotificationModule,
    NestjsFormDataModule,
  ],
  providers: [BookingService, BookingBillItemService],
  controllers: [CustomerBookingController, PhotographerBookingController],
})
export class BookingModule {}
