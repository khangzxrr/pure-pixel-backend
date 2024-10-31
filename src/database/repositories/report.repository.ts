import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  async findUniqueOrThrow(id: string) {
    return this.prisma.report.findUniqueOrThrow({
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
  ) {
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

  async create(data: Prisma.ReportCreateInput) {
    console.log(data);
    return this.prisma.report.create({
      data,
    });
  }

  async updateById(id: string, report: Prisma.ReportUpdateInput) {
    return this.prisma.report.update({
      where: {
        id,
      },
      data: report,
    });
  }
}
