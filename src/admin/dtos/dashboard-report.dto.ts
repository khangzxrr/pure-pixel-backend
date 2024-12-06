import { ApiProperty } from '@nestjs/swagger';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';
import { TopSellerDto } from './top-seller.dto';
import { Type } from 'class-transformer';
import { CameraDto } from 'src/camera/dtos/camera.dto';
import { TopUsedUpgradePackageDto } from './top-used-upgrade-package.dto';
import { TopSellingPhotoDto } from './top-selled-photo.dto';

export class DashboardReportDto {
  @ApiProperty()
  totalCustomer: number;

  @ApiProperty()
  totalPhotographer: number;

  @ApiProperty()
  totalPhotoshootPackage: number;

  @ApiProperty()
  totalCamera: number;

  @ApiProperty()
  revenueFromUpgradePackage: number;

  @ApiProperty()
  revenueFromSellingPhoto: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalPhoto: number;

  @ApiProperty()
  totalSellingPhoto: number;

  @ApiProperty({
    type: TopUsedUpgradePackageDto,
  })
  @Type(() => TopUsedUpgradePackageDto)
  topUsedUpgradePackage: TopUsedUpgradePackageDto[];

  @ApiProperty({
    type: TopSellingPhotoDto,
  })
  @Type(() => TopSellingPhotoDto)
  topSellingPhoto: TopSellingPhotoDto[];
}
