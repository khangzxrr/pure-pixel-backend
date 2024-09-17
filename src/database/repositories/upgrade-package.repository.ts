import { Injectable } from '@nestjs/common';
import { UpgradePackageStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UpgradePackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.upgradePackage.findMany({
      where: {
        status: 'ENABLED',
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
