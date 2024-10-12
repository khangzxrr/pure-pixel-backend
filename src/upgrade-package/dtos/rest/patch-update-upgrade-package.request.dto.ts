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
  IsOptional,
} from 'class-validator';

export class PatchUpdateUpgradePackageDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  price?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderMonth?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPhotoQuota: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPackageCount?: number;

  @ApiProperty({
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  descriptions?: string[];

  @ApiProperty({
    required: false,
    enum: UpgradePackageStatus,
  })
  @IsOptional()
  @IsEnum(UpgradePackageStatus)
  @IsNotEmpty()
  status?: UpgradePackageStatus;
}
