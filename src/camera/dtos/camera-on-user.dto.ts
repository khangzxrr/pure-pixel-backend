import { ApiProperty } from '@nestjs/swagger';

export class CameraOnUserDto {
  @ApiProperty()
  cameraId: string;

  @ApiProperty()
  userId: string;
}
