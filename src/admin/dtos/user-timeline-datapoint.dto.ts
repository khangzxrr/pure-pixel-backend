import { ApiProperty } from '@nestjs/swagger';

export class UserTimelineDatapointDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;
}
