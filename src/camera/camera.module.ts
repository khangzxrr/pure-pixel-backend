import { Module } from '@nestjs/common';
import { CameraConsumer } from './consumers/camera.consumer';

@Module({
  providers: [CameraConsumer],
})
export class CameraModule {}
