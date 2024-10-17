import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class BookingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  status: BookingStatus;

  @ApiProperty()
  description: string;

  @ApiProperty()
  photoshootPackageId: string;

  @ApiProperty()
  userId: string;
}
