import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardReportRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsert(
    where: Prisma.DashboardReportWhereUniqueInput,
    update: Prisma.DashboardReportUpdateInput,
    create: Prisma.DashboardReportCreateInput,
  ) {
    return this.prismaService.extendedClient().dashboardReport.upsert({
      where,
      update,
      create,
    });
  }

  findMany(where: Prisma.DashboardReportWhereInput) {
    return this.prismaService.extendedClient().dashboardReport.findMany({
      where,
    });
  }

  create(data: Prisma.DashboardReportCreateInput) {
    return this.prismaService.dashboardReport.create({
      data,
    });
  }
}
