import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PhotoModule } from 'src/photo/photo.module';

@Module({
  imports: [DatabaseModule, StorageModule, AuthenModule, PhotoModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
