import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CameraOnUserDto } from './camera-on-user.dto';

export class CameraDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  description: string;

  @Exclude()
  cameraOnUsers: CameraOnUserDto[];

  @Exclude()
  cameraMakerId: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
