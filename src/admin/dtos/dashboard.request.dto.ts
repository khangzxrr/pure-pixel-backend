import { ApiProperty } from '@nestjs/swagger';
import { IsDate } from 'class-validator';

export class DashboardRequestDto {
  @ApiProperty()
  @IsDate()
  fromDate: Date;

  @ApiProperty()
  @IsDate()
  toDate: Date;
}
