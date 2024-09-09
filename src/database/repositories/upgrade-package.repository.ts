import { Injectable } from '@nestjs/common';
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
}
