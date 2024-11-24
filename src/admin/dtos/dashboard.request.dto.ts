import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate } from 'class-validator';

export class DashboardRequestDto {
  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  fromDate: Date;

  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  toDate: Date;
}
