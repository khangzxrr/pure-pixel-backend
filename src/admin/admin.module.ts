import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PhotoModule } from 'src/photo/photo.module';
import { CameraModule } from 'src/camera/camera.module';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AuthenModule,
    PhotoModule,
    CameraModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
