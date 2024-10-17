import { ApiProperty } from '@nestjs/swagger';

export class DenyBookingRequestDto {
  @ApiProperty()
  reason: string;
}
