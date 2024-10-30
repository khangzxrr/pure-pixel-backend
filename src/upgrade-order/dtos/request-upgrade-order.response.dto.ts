import { ApiProperty } from '@nestjs/swagger';
import { PaymentUrlDto } from 'src/payment/dtos/payment-url.dto';

export class RequestUpgradeOrderResponseDto extends PaymentUrlDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  upgradePackageHistoryId: string;
}
