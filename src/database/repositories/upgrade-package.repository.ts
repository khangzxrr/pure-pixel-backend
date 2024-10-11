import { Injectable } from '@nestjs/common';
import { Prisma, UpgradePackage } from '@prisma/client';
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

  async findById(id: string) {
    return this.prisma.extendedClient().upgradePackage.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: string, upgradePackage: Partial<UpgradePackage>) {
    return this.prisma.extendedClient().upgradePackage.update({
      where: {
        id,
      },
      data: upgradePackage,
    });
  }

  async delete(id: string) {
    return this.prisma.extendedClient().upgradePackage.delete({
      where: {
        id,
      },
    });
  }

  count(where: Prisma.UpgradePackageWhereInput) {
    return this.prisma.extendedClient().upgradePackage.count({
      where,
    });
  }

  async findFirst(where: Prisma.UpgradePackageWhereInput) {
    return this.prisma.extendedClient().upgradePackage.findFirst({
      where,
    });
  }

  async findAll(
    skip: number,
    take: number,
    where: Prisma.UpgradePackageWhereInput,
    orderBy: Prisma.UpgradePackageOrderByWithRelationInput,
  ): Promise<UpgradePackage[]> {
    return this.prisma.extendedClient().upgradePackage.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }
}
