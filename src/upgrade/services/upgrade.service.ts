import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { UpgradePackageFilterDto } from '../dtos/upgrade-package.filter.dto';

@Injectable()
export class UpgradeService {
  constructor(
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
  ) {}

  async getEnableUpgradePackages(): Promise<UpgradePackageDto[]> {
    const filter = new UpgradePackageFilterDto();
    filter.status = 'ENABLED';

    const upgradePackages = await this.upgradePackageRepository.findAll(filter);

    const dtos = upgradePackages.map((up) => new UpgradePackageDto(up));

    return dtos;
  }
}
