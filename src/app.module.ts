import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { PhotographerModule } from './photographer/photographer.module';
import { AuthenModule } from './authen/authen.module';
import { DatabaseModule } from './database/database.module';
import { PhotoModule } from './photo/photo.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UpgradePackageModule } from './upgrade-package/upgrade-package.module';
import { PaymentModule } from './payment/payment.module';
import { CachingModule } from './caching/caching.module';
import { APP_FILTER } from '@nestjs/core';
import { PrismaKnownExceptionFilter } from './infrastructure/filters/prisma-known-exception.filter';
import { QueueModule } from './queue/queue.module';
import { UpgradeOrderModule } from './upgrade-order/upgrade-order.module';
import { ReportModule } from './report/report.module';
import { PhotoTagModule } from './photo-tag/photo-tag.module';
import { BlogModule } from './blog/blog.module';
import { PhotoshootPackageModule } from './photoshoot-package/photoshoot-package.module';
import { BookingModule } from './booking/booking.module';
import { ChatModule } from './chat/chat.module';
import { CameraModule } from './camera/camera.module';
import { AdminModule } from './admin/admin.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { NewsfeedModule } from './newsfeed/newsfeed.module';
import { TemporaryFileModule } from './temporary-file/temporary-file.module';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaKnownExceptionFilter,
    },
  ],
  exports: [],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StorageModule,
    AuthenModule,
    QueueModule,
    UserModule,
    PhotographerModule,
    DatabaseModule,
    PhotoModule,
    PaymentModule,
    CachingModule,
    UpgradeOrderModule,
    UpgradePackageModule,
    ReportModule,
    PhotoTagModule,
    BlogModule,
    PhotoshootPackageModule,
    BookingModule,
    ChatModule,
    CameraModule,
    AdminModule,
    BookmarkModule,
    NewsfeedModule,
    TemporaryFileModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
