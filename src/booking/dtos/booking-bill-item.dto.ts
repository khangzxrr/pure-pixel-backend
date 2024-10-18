import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

export class BookingBillItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  bookingId: string;
}
