import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UpgradeOrderDto } from './upgrade-order.dto';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';

export class UpgradeTransferFeeDto {
  @ApiProperty()
  remainPrice: number;

  @ApiProperty()
  discountPrice: number;

  @ApiProperty()
  refundPrice: number;

  @ApiProperty()
  timeSpanPassed: number;

  @ApiProperty()
  maxiumDiscoutPrice: number;

  @ApiProperty()
  maxiumDiscoutTimeSpan: number;

  @ApiProperty()
  @Type(() => UpgradeOrderDto)
  currentActivePackage: UpgradeOrderDto;

  @ApiProperty()
  @Type(() => UpgradePackageDto)
  upgradePackage: UpgradePackageDto;
}
