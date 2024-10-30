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
import { PhotoGateway } from './gateways/socket.io.gateway';
import { CacheModule } from '@nestjs/cache-manager';
import { CommentService } from './services/comment.service';
import { PhotoWatermarkConsumer } from './consumers/photo-watermark.consumer';
import { PhotoExchangeController } from './controllers/photo-exchange.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { PhotoGenerateWatermarkService } from './services/photo-generate-watermark.service';
import { PhotoVoteController } from './controllers/photo-vote.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { PhotoCommentController } from './controllers/photo-comment.controller';
import { PhotoExchangeService } from './services/photo-exchange.service';
import { PhotoVoteService } from './services/photo-vote.service';

@Module({
  providers: [
    PhotoGateway,
    PhotoService,
    PhotoProcessService,
    PhotoCategoryService,
    PhotoProcessConsumer,
    PhotoWatermarkConsumer,
    CommentService,
    PhotoGenerateWatermarkService,
    PhotoExchangeService,
    PhotoVoteService,
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
    PhotoExchangeController,
    PhotoVoteController,
    PhotoCommentController,
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
    NestjsFormDataModule,
  ],
})
export class PhotoModule {}
