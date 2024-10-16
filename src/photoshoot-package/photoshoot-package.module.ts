import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PhotoShootPackageController } from './controllers/photoshoot-package.controller';
import { PhotoshootPackageService } from './services/photoshoot-package.service';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule],
  controllers: [PhotoShootPackageController],
  providers: [PhotoshootPackageService],
})
export class PhotoshootPackageModule {}
