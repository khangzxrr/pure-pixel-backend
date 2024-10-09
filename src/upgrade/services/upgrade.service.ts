import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { plainToInstance } from 'class-transformer';
import { FindAllDto } from '../dtos/rest/find-all.request.dto';

@Injectable()
export class UpgradeService {
  constructor(
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
  ) {}

  async getEnableUpgradePackages(
    findAll: FindAllDto,
  ): Promise<PagingPaginatedResposneDto<UpgradePackageDto>> {
    console.log(findAll.toWhere());

    const upgradePackages = await this.upgradePackageRepository.findAll(
      findAll.toWhere(),
      findAll.toOrderBy(),
    );

    const count = await this.upgradePackageRepository.count(findAll.toWhere());

    const objects = plainToInstance(UpgradePackageDto, upgradePackages);

    return new PagingPaginatedResposneDto<UpgradePackageDto>(
      findAll.limit,
      count,
      objects,
    );
  }
}
