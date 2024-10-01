import { ApiProperty } from '@nestjs/swagger';

export class CreateDepositResponseDto {
  @ApiProperty()
  paymentUrl: string;

  @ApiProperty()
  testQRCode: string;

  constructor(paymentUrl: string, testQRCode: string) {
    this.paymentUrl = paymentUrl;
    this.testQRCode = testQRCode;
  }
}
