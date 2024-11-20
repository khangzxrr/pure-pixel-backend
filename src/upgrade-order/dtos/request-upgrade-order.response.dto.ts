import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentUrlDto } from 'src/payment/dtos/payment-url.dto';
import { ServiceTransactionDto } from 'src/payment/dtos/service-transaction.dto';
import { UpgradePackageHistoryDto } from 'src/upgrade-package/dtos/upgrade-package-history.dto';

export class RequestUpgradeOrderResponseDto extends PaymentUrlDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @Type(() => ServiceTransactionDto)
  serviceTransaction: ServiceTransactionDto;

  @ApiProperty()
  @Type(() => UpgradePackageHistoryDto)
  upgradePackageHistory: UpgradePackageHistoryDto;
}
