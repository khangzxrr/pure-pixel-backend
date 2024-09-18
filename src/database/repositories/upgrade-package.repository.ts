import { Injectable } from '@nestjs/common';
import { UpgradePackageStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UpgradePackageFilterDto } from 'src/upgrade/dtos/upgrade-package.filter.dto';

@Injectable()
export class UpgradePackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(upgradePackageFilterDto: UpgradePackageFilterDto) {
    return this.prisma.upgradePackage.findMany({
      where: {
        status: upgradePackageFilterDto.status,
      },
      orderBy: {
        price: 'asc',
      },
    });
  }

  async findById(id: string, status?: UpgradePackageStatus) {
    return this.prisma.upgradePackage.findFirst({
      where: {
        id,
        status,
      },
    });
  }
}
