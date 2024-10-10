import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UpgradePackageFindAllDto } from '../dtos/rest/upgrade-package-find-all.request.dto';
import { plainToInstance } from 'class-transformer';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { UpgradePackageFindAllResposneDto } from '../dtos/rest/upgrade-package-find-all.response';

@Injectable()
export class UpgradePackageService {
  constructor(
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
  ) {}

  async findAll(findAllDto: UpgradePackageFindAllDto) {
    const upgradePackages = await this.upgradePackageRepository.findAll(
      findAllDto.toSkip(),
      findAllDto.limit,
      findAllDto.toWhere(),
      findAllDto.toOrderBy(),
    );

    const dtos = plainToInstance(UpgradePackageDto, upgradePackages);

    const count = await this.upgradePackageRepository.count(
      findAllDto.toWhere(),
    );

    return new UpgradePackageFindAllResposneDto(findAllDto.limit, count, dtos);
  }
}
