import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UpgradePackageFindAllDto } from '../dtos/rest/upgrade-package-find-all.request.dto';
import { plainToInstance } from 'class-transformer';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { UpgradePackageFindAllResposneDto } from '../dtos/rest/upgrade-package-find-all.response';
import { CreateUpgradePackageDto } from '../dtos/rest/create-upgrade-package.request.dto';
import { UpgradePackageEntity } from '../entities/upgrade-package.entity';
import { ExistUpgradePackageWithSameNameException } from '../exceptions/exist-upgrade-package-with-same-name.exception';
import { UpgradePackageNotFoundException } from '../exceptions/upgrade-package-not-found.exception';

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

  async delete(id: string) {
    const upgradePackage = await this.upgradePackageRepository.findById(id);

    if (!upgradePackage) {
      throw new UpgradePackageNotFoundException();
    }

    const d = await this.upgradePackageRepository.delete(id);

    return plainToInstance(UpgradePackageDto, d);
  }

  async create(createUpgradePackageDto: CreateUpgradePackageDto) {
    const existByName = await this.upgradePackageRepository.findUnique({
      name: createUpgradePackageDto.name,
    });
    if (existByName) {
      throw new ExistUpgradePackageWithSameNameException();
    }

    const upgradePackage = plainToInstance(
      UpgradePackageEntity,
      createUpgradePackageDto,
    );

    const newUpgradePackage =
      await this.upgradePackageRepository.create(upgradePackage);

    return plainToInstance(UpgradePackageDto, newUpgradePackage);
  }
}
