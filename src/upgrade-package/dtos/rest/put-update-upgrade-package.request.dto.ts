import { ApiProperty } from '@nestjs/swagger';
import { UpgradePackageStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  ArrayNotEmpty,
  IsEnum,
} from 'class-validator';

export class PutUpdateUpgradePackageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  summary: string;

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
