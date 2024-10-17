import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PhotoShootPackageController } from './controllers/photoshoot-package.controller';
import { PhotoshootPackageService } from './services/photoshoot-package.service';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { PhotoModule } from 'src/photo/photo.module';
import { PhotoshootPackageDetailController } from './controllers/photoshoot-package-detail.controller';
import { CustomerPhotoshootPackageController } from './controllers/customer-photoshoot-package.controller';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    AuthenModule,
    StorageModule,
    PhotoModule,
  ],
  controllers: [
    PhotoShootPackageController,
    PhotoshootPackageDetailController,
    CustomerPhotoshootPackageController,
  ],
  providers: [PhotoshootPackageService],
})
export class PhotoshootPackageModule {}
