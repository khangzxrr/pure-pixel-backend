import { ApiProperty } from '@nestjs/swagger';
import { IsDate } from 'class-validator';

export class DashboardRequestDto {
  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
  })
  @IsDate()
  fromDate: Date;

  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
  })
  @IsDate()
  toDate: Date;
}
