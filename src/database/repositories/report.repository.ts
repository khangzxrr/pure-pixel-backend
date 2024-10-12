import { Injectable } from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(where: Prisma.ReportWhereInput) {
    return this.prisma.report.count({
      where,
    });
  }

  async findAll(
    take: number,
    skip: number,
    where: Prisma.ReportWhereInput,
    orderBy: Prisma.ReportOrderByWithRelationInput[],
  ): Promise<Report[]> {
    return this.prisma.report.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async create(report: Report) {
    return this.prisma.report.create({
      data: report,
    });
  }

  async updateById(id: string, report: Partial<Report>) {
    return this.prisma.report.update({
      where: {
        id,
      },
      data: report,
    });
  }
}
