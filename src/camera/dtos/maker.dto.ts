import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { CameraDto } from './camera.dto';

export class MakerDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  @Type(() => CameraDto)
  cameras: CameraDto[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
