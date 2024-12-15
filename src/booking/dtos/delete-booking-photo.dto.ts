import { ApiProperty } from '@nestjs/swagger';

export class DeleteBookingPhotoDto {
  @ApiProperty()
  bookingId: string;
}
