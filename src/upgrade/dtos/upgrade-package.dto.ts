import { ApiProperty } from '@nestjs/swagger';
import { UpgradePackage } from '@prisma/client';

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
  maxPhotoCount: number;

  @ApiProperty()
  maxPackageCount: number;

  @ApiProperty()
  maxBookingPhotoCount: number;

  @ApiProperty()
  maxBookingVideoCount: number;

  constructor({ ...data }: Partial<UpgradePackage>) {
    Object.assign(this, data);

    if (data.price) {
      this.price = data.price.toNumber();
    }
  }
}
