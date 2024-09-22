import { ApiProperty } from '@nestjs/swagger';
import { UpgradePackageEntity } from '../entities/upgrade-package.entity';

export class UpgradePackageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  description: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  minOrderMonth: number;

  @ApiProperty()
  maxPhotoQuota: number;

  @ApiProperty()
  maxPackageCount: number;

  @ApiProperty()
  maxBookingPhotoQuota: number;

  @ApiProperty()
  maxBookingVideoQuota: number;

  constructor({ ...data }: Partial<UpgradePackageEntity>) {
    Object.assign(this, data);

    if (data.price) {
      this.price = data.price.toNumber();
    }
  }
}
