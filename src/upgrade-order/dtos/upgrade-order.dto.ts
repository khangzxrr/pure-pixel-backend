import { ApiProperty } from '@nestjs/swagger';
import { UpgradeOrderStatus } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { ServiceTransactionDto } from 'src/payment/dtos/service-transaction.dto';
import { UpgradePackageHistoryDto } from 'src/upgrade-package/dtos/upgrade-package-history.dto';

export class UpgradeOrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  expiredAt: Date;

  @Exclude()
  userId: string;

  @ApiProperty()
  status: UpgradeOrderStatus;

  @ApiProperty()
  @Type(() => ServiceTransactionDto)
  serviceTransaction: ServiceTransactionDto;

  @ApiProperty()
  @Type(() => UpgradePackageHistoryDto)
  upgradePackageHistory: UpgradePackageHistoryDto;
}
