import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FollowRepository {
  constructor(private readonly prismaService: PrismaService) {}

  delete(where: Prisma.FollowWhereUniqueInput) {
    return this.prismaService.extendedClient().follow.delete({
      where,
    });
  }

  upsert(
    where: Prisma.FollowWhereUniqueInput,
    create: Prisma.FollowCreateInput,
  ) {
    return this.prismaService.extendedClient().follow.upsert({
      where,
      update: {},
      create,
    });
  }

  findUnique(
    where: Prisma.FollowWhereUniqueInput,
    include: Prisma.FollowInclude,
  ) {
    return this.prismaService.extendedClient().follow.findUnique({
      where,
      include,
    });
  }

  count(where: Prisma.FollowWhereInput) {
    return this.prismaService.extendedClient().follow.count({
      where,
    });
  }

  findAll(
    where: Prisma.FollowWhereInput,
    include: Prisma.FollowInclude,
    skip: number,
    take: number,
  ) {
    return this.prismaService.extendedClient().follow.findMany({
      where,
      include,
      skip,
      take,
    });
  }
}
