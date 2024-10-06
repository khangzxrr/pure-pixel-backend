import { ApiProperty } from '@nestjs/swagger';

export class paymentUrlDto {
  @ApiProperty()
  mockQrCode: string;

  @ApiProperty()
  paymentUrl: string;
}
