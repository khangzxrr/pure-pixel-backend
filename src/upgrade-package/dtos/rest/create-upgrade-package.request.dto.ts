import { ApiProperty } from '@nestjs/swagger';
import { UpgradePackageStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateUpgradePackageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  price: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  minOrderMonth: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxPhotoQuota: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxPackageCount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxBookingPhotoQuota: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxBookingVideoQuota: number;

  @ApiProperty({
    isArray: true,
    type: String,
  })
  @ArrayNotEmpty()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  descriptions: string[];

  @ApiProperty({
    enum: UpgradePackageStatus,
  })
  @IsEnum(UpgradePackageStatus)
  @IsNotEmpty()
  status: UpgradePackageStatus;
}
