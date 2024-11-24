import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TopUsedUpgradePackageDto } from './top-used-upgrade-package.dto';
import { TopSellingPhotoDto } from './top-selled-photo.dto';

export class DashboardReportDto {
  @ApiProperty()
  @Type(() => Number)
  totalCustomer: number;

  @ApiProperty()
  @Type(() => Number)
  totalPhotographer: number;

  @ApiProperty()
  @Type(() => Number)
  totalEmployee: number;

  @ApiProperty()
  @Type(() => Number)
  totalRevenue: number;

  @ApiProperty()
  @Type(() => Number)
  totalPhotoshootPackage: number;

  @ApiProperty()
  @Type(() => Number)
  revenueFromUpgradePackage: number;

  @ApiProperty()
  @Type(() => Number)
  revenueFromSellingPhoto: number;

  @ApiProperty()
  @Type(() => Number)
  totalPhoto: number;

  @ApiProperty()
  @Type(() => Number)
  userTotal: number;

  @ApiProperty()
  @Type(() => TopUsedUpgradePackageDto)
  topUsedUpgradePackages: TopUsedUpgradePackageDto[];

  @ApiProperty()
  @Type(() => TopSellingPhotoDto)
  topSelledPhotos: TopSellingPhotoDto[];

  constructor(
    totalCustomer: number,
    totalPhotographer: number,
    totalEmployee: number,
    totalRevenue: number,
    totalPhotoshootPackage: number,
    revenueFromUpgradePackage: number,
    revenueFromSellingPhoto: number,
    totalPhoto: number,
    userTotal: number,
    topUsedUpgradePackages: TopUsedUpgradePackageDto[],
    topSelledPhotos: TopSellingPhotoDto[],
  ) {
    this.totalCustomer = totalCustomer;
    this.totalPhotographer = totalPhotographer;
    this.totalEmployee = totalEmployee;
    this.totalRevenue = totalRevenue;
    this.totalPhotoshootPackage = totalPhotoshootPackage;
    this.revenueFromUpgradePackage = revenueFromUpgradePackage;
    this.revenueFromSellingPhoto = revenueFromSellingPhoto;
    this.totalPhoto = totalPhoto;
    this.userTotal = userTotal;
    this.topUsedUpgradePackages = topUsedUpgradePackages;
    this.topSelledPhotos = topSelledPhotos;
  }
}
