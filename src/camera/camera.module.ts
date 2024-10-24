import { Module } from '@nestjs/common';
import { CameraConsumer } from './consumers/camera.consumer';
import { DatabaseModule } from 'src/database/database.module';
import { CameraController } from './controllers/camera.controller';
import { CameraService } from './services/camera.service';
import { UpdateTimelineService } from './crons/update-timeline.service.cron';

@Module({
  imports: [DatabaseModule],
  providers: [CameraConsumer, CameraService, UpdateTimelineService],
  controllers: [CameraController],
})
export class CameraModule {}
