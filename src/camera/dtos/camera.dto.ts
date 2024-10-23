import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CameraOnUserDto } from './camera-on-user.dto';

export class CameraDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  thumbnail: string;

  @Exclude()
  cameraOnUsers: CameraOnUserDto[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
