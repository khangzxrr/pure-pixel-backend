import { Module } from '@nestjs/common';
import { PhotoController } from './controllers/photo.controller';
import { PhotoService } from './services/photo.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthenModule } from 'src/authen/authen.module';

@Module({
  providers: [PhotoService],
  controllers: [PhotoController],
  imports: [AuthenModule, DatabaseModule, StorageModule],
})
export class PhotoModule {}
