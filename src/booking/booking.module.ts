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
import { PhotographerBookingBillItemController } from './controllers/photographer-booking-bill-item.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { CachingModule } from 'src/caching/caching.module';

import { UserModule } from 'src/user/user.module';
import { QueueModule } from 'src/queue/queue.module';

import { BookingConsumer } from './consumers/booking.consumer';
import { ManagerBookingController } from './controllers/manager-booking.controller';
import { ManageBookingService } from './services/manage-booking.service';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    PhotoModule,
    AuthenModule,
    NotificationModule,
    NestjsFormDataModule,
    CachingModule,
    PaymentModule,
    UserModule,
    QueueModule,
  ],
  providers: [
    BookingService,
    BookingBillItemService,
    BookingConsumer,
    ManageBookingService,
  ],
  controllers: [
    CustomerBookingController,
    PhotographerBookingController,
    PhotographerBookingBillItemController,
    ManagerBookingController,
  ],
})
export class BookingModule {}
