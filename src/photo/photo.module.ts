import { Module } from '@nestjs/common';
import { PhotoController } from './controllers/photo.controller';
import { PhotoService } from './services/photo.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthenModule } from 'src/authen/authen.module';
import { PhotoCleanUpCronService } from './services/photo-clean-up.cron.service';
import { PhotoProcessService } from './services/photo-process.service';
import { HttpModule } from '@nestjs/axios';
import { PhotoCategoryService } from './services/photo-category.service';
import { PhotoCategoryController } from './controllers/photo-category.controller';
import { QueueModule } from 'src/queue/queue.module';
import { PhotoProcessConsumer } from './consumers/photo-process.consumer';
import { PhotoGateway } from './gateways/socket.io.gateway';
import { CacheModule } from '@nestjs/cache-manager';
import { CommentService } from './services/comment.service';
import { PhotoWatermarkConsumer } from './consumers/photo-watermark.consumer';
import { PhotoShareConsumer } from './consumers/photo-share.consumer';
import { PhotoExchangeController } from './controllers/photo-exchange.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { PhotoGenerateWatermarkService } from './services/photo-generate-watermark.service';
import { PhotoGenerateShareService } from './services/photo-generate-share.service';
import { PhotoVoteController } from './controllers/photo-vote.controller';

@Module({
  providers: [
    PhotoGateway,
    PhotoService,
    PhotoCleanUpCronService,
    PhotoProcessService,
    PhotoCategoryService,
    PhotoProcessConsumer,
    PhotoWatermarkConsumer,
    PhotoShareConsumer,
    CommentService,
    PhotoGenerateWatermarkService,
    PhotoGenerateShareService,
  ],
  exports: [PhotoService, PhotoProcessService, PhotoCategoryService],
  controllers: [
    PhotoController,
    PhotoCategoryController,
    PhotoExchangeController,
    PhotoVoteController,
  ],
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 10,
    }),
    CacheModule.register(),
    AuthenModule,
    DatabaseModule,
    StorageModule,
    QueueModule,
    PaymentModule,
  ],
})
export class PhotoModule {}
