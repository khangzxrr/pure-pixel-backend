import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { BookingService } from './services/booking.service';
import { CustomerBookingController } from './controllers/customer-booking.controller';
import { PhotographerBookingController } from './controllers/photographer-booking.controller';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [DatabaseModule, StorageModule, AuthenModule, NotificationModule],
  providers: [BookingService],
  controllers: [CustomerBookingController, PhotographerBookingController],
})
export class BookingModule {}