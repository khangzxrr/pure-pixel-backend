import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChangeLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(where: Prisma.ChangeLogWhereInput) {
    return this.prisma.changeLog.count({
      where,
    });
  }

  async findByIdOrThrow(id: string) {
    return this.prisma.changeLog.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }

  async findFirst(findFirst: Prisma.ChangeLogFindFirstArgs) {
    return this.prisma.changeLog.findFirst(findFirst);
  }

  async findAll(findall: Prisma.ChangeLogFindManyArgs) {
    return this.prisma.changeLog.findMany(findall);
  }

  async create(changeLog: Prisma.ChangeLogCreateInput) {
    return this.prisma.changeLog.create({
      data: changeLog,
    });
  }

  async updateById(id: string, changeLog: Prisma.ChangeLogUpdateInput) {
    return this.prisma.changeLog.update({
      where: {
        id,
      },
      data: changeLog,
    });
  }

  async deleteById(id: string) {
    return this.prisma.changeLog.delete({
      where: {
        id,
      },
    });
  }
}
