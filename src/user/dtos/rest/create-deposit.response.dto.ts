import { ApiProperty } from '@nestjs/swagger';

export class CreateDepositResponseDto {
  @ApiProperty()
  paymentUrl: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  testQRCode: string;

  constructor(paymentUrl: string, testQRCode: string, transactionId: string) {
    this.paymentUrl = paymentUrl;
    this.testQRCode = testQRCode;
    this.transactionId = transactionId;
  }
}
