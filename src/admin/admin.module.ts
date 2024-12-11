import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PhotoModule } from 'src/photo/photo.module';
import { CameraModule } from 'src/camera/camera.module';
import { UserModule } from 'src/user/user.module';
import { QueueModule } from 'src/queue/queue.module';
import { GenerateDashboardReportService } from './crons/generate-dashboard-report.cron.service';
import { NotificationModule } from 'src/notification/notification.module';
import { CachingModule } from 'src/caching/caching.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AuthenModule,
    PhotoModule,
    UserModule,
    CameraModule,
    QueueModule,
    NotificationModule,
    CachingModule,
    PaymentModule,
  ],
  providers: [AdminService, GenerateDashboardReportService],
  controllers: [AdminController],
})
export class AdminModule {}
