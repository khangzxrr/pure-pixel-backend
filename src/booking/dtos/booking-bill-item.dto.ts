import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BookingBillItemCreateDto } from './booking-bill-item.create.dto';

export class BookingBillItemDto extends BookingBillItemCreateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  bookingId: string;
}
