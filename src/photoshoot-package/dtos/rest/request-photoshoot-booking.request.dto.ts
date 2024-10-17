import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsString, MinDate } from 'class-validator';

export class RequestPhotoshootBookingRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoshootPackageId: string;

  @ApiProperty()
  @IsDate()
  @MinDate(new Date())
  bookingFromDate: Date;

  @ApiProperty()
  @IsDate()
  @MinDate(new Date())
  bookingToDate: Date;

  @ApiProperty()
  description: string;
}
