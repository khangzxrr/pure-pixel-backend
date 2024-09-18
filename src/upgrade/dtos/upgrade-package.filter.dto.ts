import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpgradePackageStatus } from '@prisma/client';

export class UpgradePackageFilterDto {
  @ApiPropertyOptional()
  status?: UpgradePackageStatus;
}
