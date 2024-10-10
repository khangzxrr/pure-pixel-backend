import { Injectable } from '@nestjs/common';
import { Prisma, UpgradePackage, UpgradePackageStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UpgradePackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(upgradePackage: UpgradePackage) {
    return this.prisma.extendedClient().upgradePackage.create({
      data: upgradePackage,
    });
  }

  async updateById(id: string, upgradePackage: Partial<UpgradePackage>) {
    return this.prisma.extendedClient().upgradePackage.update({
      where: {
        id,
      },
      data: upgradePackage,
    });
  }

  count(where: Prisma.UpgradePackageWhereInput) {
    return this.prisma.extendedClient().upgradePackage.count({
      where,
    });
  }

  async findAll(
    skip: number,
    take: number,
    where: Prisma.UpgradePackageWhereInput,
    orderBy: Prisma.UpgradePackageOrderByWithRelationInput,
  ) {
    return this.prisma.extendedClient().upgradePackage.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async findById(id: string, status?: UpgradePackageStatus) {
    return this.prisma.extendedClient().upgradePackage.findFirst({
      where: {
        id,
        status,
      },
    });
  }
}
