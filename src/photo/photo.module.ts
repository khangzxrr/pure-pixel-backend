import { Module } from '@nestjs/common';
import { PhotoController } from './controllers/photo.controller';
import { PhotoService } from './services/photo.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthenModule } from 'src/authen/authen.module';
import { PhotoCleanUpCronService } from './services/photo-clean-up.cron.service';
import { QueueModule } from 'src/queue/queue.module';
import { PhotoProcessService } from './services/photo-process.service';
import { HttpModule } from '@nestjs/axios';
import { CachingModule } from 'src/caching/caching.module';

@Module({
  providers: [PhotoService, PhotoCleanUpCronService, PhotoProcessService],
  controllers: [PhotoController],
  imports: [
    HttpModule,
    AuthenModule,
    DatabaseModule,
    StorageModule,
    QueueModule,
    CachingModule,
  ],
})
export class PhotoModule {}
