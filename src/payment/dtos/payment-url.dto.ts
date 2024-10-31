import { ApiProperty } from '@nestjs/swagger';

export class PaymentUrlDto {
  @ApiProperty()
  mockQrCode: string;

  @ApiProperty()
  paymentUrl: string;
}
