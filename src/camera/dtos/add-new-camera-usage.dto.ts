import { ApiProperty } from '@nestjs/swagger';

export class AddNewCameraUsageDto {
  @ApiProperty()
  photoId: string;
}
