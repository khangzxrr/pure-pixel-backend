import { Module } from '@nestjs/common';
import { PhotographerController } from './controllers/photographer.controller';
import { PhotographerService } from './services/photographer.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthenModule } from 'src/authen/authen.module';
import { PhotoModule } from 'src/photo/photo.module';

@Module({
  controllers: [PhotographerController],
  providers: [PhotographerService],
  imports: [DatabaseModule, StorageModule, AuthenModule, PhotoModule],
})
export class PhotographerModule {}
