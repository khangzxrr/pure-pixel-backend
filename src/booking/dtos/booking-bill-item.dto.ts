import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BookingBillItemCreateDto } from './booking-bill-item.create.dto';
import { BookingBillItemType } from '@prisma/client';

export class BookingBillItemDto extends BookingBillItemCreateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: BookingBillItemType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  bookingId: string;
}
