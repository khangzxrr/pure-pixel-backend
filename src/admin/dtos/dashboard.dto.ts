import { ApiProperty } from '@nestjs/swagger';
import { UserTimelineDatapointDto } from './user-timeline-datapoint.dto';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';

export class DashboardDto {
  @ApiProperty()
  totalCustomer: number;

  @ApiProperty()
  totalPhotographer: number;

  @ApiProperty()
  totalEmployee: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalRevenueFromUpgradePackage: number;

  @ApiProperty()
  totalRevenueFromSellingPhoto: number;

  @ApiProperty()
  photographerDatapoints: UserTimelineDatapointDto[];

  @ApiProperty()
  customerDatapoints: UserTimelineDatapointDto[];

  @ApiProperty()
  mostUsedUpgradePackages: UpgradePackageDto[];
}
