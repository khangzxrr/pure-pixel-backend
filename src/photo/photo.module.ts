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

@Module({
  providers: [
    PhotoService,
    PhotoCleanUpCronService,
    PhotoProcessService,
    PhotoCategoryService,
  ],
  exports: [PhotoService, PhotoCategoryService],
  controllers: [PhotoController, PhotoCategoryController],
  imports: [HttpModule, AuthenModule, DatabaseModule, StorageModule],
})
export class PhotoModule {}