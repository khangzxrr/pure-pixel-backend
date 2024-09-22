import { ApiProperty } from '@nestjs/swagger';

export class RequestUpgradeOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  originalUpgradePackageId: string;

  @ApiProperty()
  paymentQrcodeUrl: string;

  @ApiProperty()
  mockQrcode: string;
}
