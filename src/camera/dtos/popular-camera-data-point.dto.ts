import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { CameraDto } from './camera.dto';

export class PopularCameraDataPointDto {
  @ApiProperty()
  id: string;

  @Exclude()
  timelineId: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  cameraId: string;

  @ApiProperty()
  userCount: number;

  @ApiProperty()
  @Type(() => CameraDto)
  camera: CameraDto;
}
