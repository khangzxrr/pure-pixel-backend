import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';

export class TopUsedUpgradePackageDto {
  @ApiProperty()
  @IsNumber()
  totalUsed: number;

  @ApiProperty()
  @Type(() => UpgradePackageDto)
  upgradePackageDto: UpgradePackageDto;
}
