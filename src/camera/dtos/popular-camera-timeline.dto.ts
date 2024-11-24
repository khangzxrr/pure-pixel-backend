import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { PopularCameraDataPointDto } from './popular-camera-data-point.dto';

export class PopularCameraTimelineDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  timestamp: Date;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PopularCameraDataPointDto)
  popularCameraDataPoints: PopularCameraDataPointDto[];
}
