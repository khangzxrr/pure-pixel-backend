import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, MinDate } from 'class-validator';

export class BookingUpdateRequestDto {
  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
    required: false,
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  startDate?: Date;

  @ApiProperty({
    example: '2024-10-19T01:30:14.761+07:00',
    required: false,
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  endDate?: Date;

  @ApiProperty({
    required: false,
  })
  description?: string;
}
