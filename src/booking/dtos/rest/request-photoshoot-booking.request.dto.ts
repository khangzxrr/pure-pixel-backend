import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, MinDate } from 'class-validator';

export class RequestPhotoshootBookingRequestDto {
  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  startDate: Date;

  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  endDate: Date;

  @ApiProperty()
  description: string;
}
