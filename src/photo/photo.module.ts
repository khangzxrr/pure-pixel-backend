import { Module } from '@nestjs/common';
import { PhotoController } from './controllers/photo.controller';
import { PhotoService } from './services/photo.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthenModule } from 'src/authen/authen.module';
import { PhotoProcessService } from './services/photo-process.service';
import { HttpModule } from '@nestjs/axios';
import { PhotoCategoryService } from './services/photo-category.service';
import { PhotoCategoryController } from './controllers/photo-category.controller';
import { QueueModule } from 'src/queue/queue.module';
import { PhotoProcessConsumer } from './consumers/photo-process.consumer';
import { PhotoGateway } from './gateways/photo.gateway';

import { CommentService } from './services/comment.service';
import { PhotoWatermarkConsumer } from './consumers/photo-watermark.consumer';
import { PhotoSellBuyController } from './controllers/photo-sellbuy.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { PhotoGenerateWatermarkService } from './services/photo-generate-watermark.service';
import { PhotoVoteController } from './controllers/photo-vote.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { PhotoCommentController } from './controllers/photo-comment.controller';
import { PhotoExchangeService } from './services/photo-exchange.service';
import { PhotoVoteService } from './services/photo-vote.service';
import { PhotoViewCountConsumer } from './consumers/photo-view-count.consumer';
import { PhotoValidateService } from './services/photo-validate.service';
import { PhotoExchangeController } from './controllers/photo-exchange.controller';

import { ManagePhotoController } from './controllers/manage-photo.controller';
import { ManagePhotoService } from './services/manage-photo.service';
import { NotificationModule } from 'src/notification/notification.module';
import { CachingModule } from 'src/caching/caching.module';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [
    PhotoGateway,
    PhotoService,
    PhotoProcessService,
    PhotoCategoryService,
    PhotoProcessConsumer,
    PhotoWatermarkConsumer,
    PhotoViewCountConsumer,
    CommentService,
    PhotoGenerateWatermarkService,
    PhotoExchangeService,
    PhotoVoteService,
    PhotoValidateService,
    ManagePhotoService,
  ],
  exports: [
    PhotoService,
    PhotoProcessService,
    PhotoCategoryService,
    PhotoProcessConsumer,
  ],
  controllers: [
    PhotoController,
    PhotoCategoryController,
    PhotoSellBuyController,
    PhotoVoteController,
    PhotoCommentController,
    PhotoExchangeController,
    ManagePhotoController,
  ],
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 10,
    }),
    CachingModule,
    AuthenModule,
    DatabaseModule,
    StorageModule,
    QueueModule,
    PaymentModule,
    NotificationModule,
    NestjsFormDataModule,
    UserModule,
  ],
})
export class PhotoModule {}
