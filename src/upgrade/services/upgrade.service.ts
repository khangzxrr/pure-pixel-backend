import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';

@Injectable()
export class UpgradeService {
  constructor(
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
  ) {}

  async findAll() {
    const upgradePackages = await this.upgradePackageRepository.findAll();

    const dtos = upgradePackages.map((up) => up as UpgradePackageDto);
    return dtos;
  }
}
