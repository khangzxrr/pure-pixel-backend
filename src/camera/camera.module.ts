import { Module } from '@nestjs/common';
import { CameraConsumer } from './consumers/camera.consumer';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [CameraConsumer],
})
export class CameraModule {}
