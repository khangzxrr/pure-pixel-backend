import { ApiProperty } from '@nestjs/swagger';
import { UpgradePackageDto } from './upgrade-package.dto';
import { Type } from 'class-transformer';

export class UpgradePackageHistoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  minOrderMonth: number;

  @ApiProperty()
  maxPhotoQuota: number;

  @ApiProperty()
  maxPackageCount: number;

  @ApiProperty()
  summary: number;

  @ApiProperty()
  descriptions: string[];

  @ApiProperty()
  @Type(() => UpgradePackageDto)
  originalUpgradePackage: UpgradePackageDto;
}
