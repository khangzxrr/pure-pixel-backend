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

@Module({
  providers: [
    PhotoGateway,
    PhotoService,
    PhotoCleanUpCronService,
    PhotoProcessService,
    PhotoCategoryService,
    PhotoProcessConsumer,
  ],
  exports: [PhotoService, PhotoCategoryService],
  controllers: [PhotoController, PhotoCategoryController],
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 10,
    }),
    AuthenModule,
    DatabaseModule,
    StorageModule,
    QueueModule,
  ],
})
export class PhotoModule {}
