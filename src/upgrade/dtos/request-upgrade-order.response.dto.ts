import { ApiProperty } from '@nestjs/swagger';

export class RequestUpgradeOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  upgradePackageHistoryId: string;

  @ApiProperty()
  paymentQrcodeUrl: string;

  @ApiProperty()
  mockQrcode: string;
}
