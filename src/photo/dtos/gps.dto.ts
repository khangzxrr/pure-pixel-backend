import { ApiProperty } from '@nestjs/swagger';
import { Max, Min } from 'class-validator';

export class GpsDto {
  @ApiProperty()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @Min(-180)
  @Max(180)
  longitude: number;
}
