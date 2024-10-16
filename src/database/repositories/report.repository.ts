import { Injectable } from '@nestjs/common';
import { Prisma, Report, ReportStatus, ReportType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: string) {
    return this.prisma.report.delete({
      where: {
        id,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.report.findUnique({
      where: {
        id,
      },
    });
  }

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
      include: {
        user: true,
      },
    });
  }

  async create(
    userId: string,
    content: string,
    reportType: ReportType,
    reportStatus: ReportStatus,
    referenceId: string,
  ) {
    return this.prisma.report.create({
      data: {
        referenceId,
        reportStatus,
        reportType,
        content,
        archived: false,

        user: {
          connect: {
            id: userId,
          },
        },
      },
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
