import { Module } from '@nestjs/common';
import { CameraConsumer } from './consumers/camera.consumer';
import { DatabaseModule } from 'src/database/database.module';
import { CameraController } from './controllers/camera.controller';
import { CameraService } from './services/camera.service';
import { UpdateTimelineService } from './crons/update-timeline.service.cron';
import { ManageCameraController } from './controllers/manage-camera.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule, NestjsFormDataModule],
  providers: [CameraConsumer, CameraService, UpdateTimelineService],
  exports: [UpdateTimelineService],
  controllers: [CameraController, ManageCameraController],
})
export class CameraModule {}
