import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PhotoShootPackageController } from './controllers/photoshoot-package.controller';
import { PhotoshootPackageService } from './services/photoshoot-package.service';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { PhotoModule } from 'src/photo/photo.module';
import { PhotographerPhotoShootPackageController } from './controllers/photographer-photoshoot-package.controller';
import { ManagePhotoshootPackageService } from './services/manage-photoshoot-package.service';
import { ManagerPhotoShootPackageController } from './controllers/manager-photoshoot-package.controller';
import { PhotographerPhotoshootPackageShowCaseController } from './controllers/photographer-photoshoot-package-showcase.controller';
import { TemporaryFileModule } from 'src/temporary-file/temporary-file.module';
import { QueueModule } from 'src/queue/queue.module';
import { PhotoshootPackageConsumerService } from './consumers/photoshoot-package.consumer.service';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    AuthenModule,
    StorageModule,
    PhotoModule,
    TemporaryFileModule,
    QueueModule,
  ],
  controllers: [
    PhotoShootPackageController,
    PhotographerPhotoShootPackageController,
    ManagerPhotoShootPackageController,
    PhotographerPhotoshootPackageShowCaseController,
  ],
  providers: [
    PhotoshootPackageService,
    ManagePhotoshootPackageService,
    PhotoshootPackageConsumerService,
  ],
})
export class PhotoshootPackageModule {}
