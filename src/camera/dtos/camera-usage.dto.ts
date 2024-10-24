import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CameraUsageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  userCount: number;
}
