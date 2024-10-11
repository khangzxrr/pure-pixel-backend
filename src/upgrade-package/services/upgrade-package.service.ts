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
import { PatchUpdateUpgradePackageDto } from '../dtos/rest/patch-update-upgrade-package.request.dto';
import { PutUpdateUpgradePackageDto } from '../dtos/rest/put-update-upgrade-package.request.dto';

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

    const dtos: UpgradePackageDto[] = plainToInstance(
      UpgradePackageDto,
      upgradePackages,
    );

    const count = await this.upgradePackageRepository.count(
      findAllDto.toWhere(),
    );

    return new UpgradePackageFindAllResposneDto(findAllDto.limit, count, dtos);
  }

  async replace(id: string, upgradePackageDto: PutUpdateUpgradePackageDto) {
    const upgradePackageById = await this.upgradePackageRepository.findById(id);
    if (!upgradePackageById) {
      throw new UpgradePackageNotFoundException();
    }

    if (upgradePackageDto.name) {
      const existByName = await this.upgradePackageRepository.findFirst({
        name: upgradePackageDto.name,
      });
      if (existByName && existByName.id !== id) {
        throw new ExistUpgradePackageWithSameNameException();
      }
    }

    const upgradePackage = plainToInstance(
      UpgradePackageEntity,
      upgradePackageDto,
    );

    const updatedUpgradePackage = await this.upgradePackageRepository.update(
      id,
      upgradePackage,
    );

    return plainToInstance(UpgradePackageDto, updatedUpgradePackage);
  }

  async update(id: string, patchUpdateDto: PatchUpdateUpgradePackageDto) {
    const upgradePackageById = await this.upgradePackageRepository.findById(id);
    if (!upgradePackageById) {
      throw new UpgradePackageNotFoundException();
    }

    if (patchUpdateDto.name) {
      const existByName = await this.upgradePackageRepository.findFirst({
        name: patchUpdateDto.name,
      });
      if (existByName && existByName.id !== id) {
        throw new ExistUpgradePackageWithSameNameException();
      }
    }

    const upgradePackage = plainToInstance(
      UpgradePackageEntity,
      patchUpdateDto,
    );
    const updatedUpgradePackage = await this.upgradePackageRepository.update(
      id,
      upgradePackage,
    );

    return plainToInstance(UpgradePackageDto, updatedUpgradePackage);
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
    const existByName = await this.upgradePackageRepository.findFirst({
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
