import { ApiProperty } from '@nestjs/swagger';

export class TimelineDatapointDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;
}
