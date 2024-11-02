import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class NewsfeedRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: Prisma.NewsfeedCreateInput) {
    return this.prismaService.extendedClient().newsfeed.create({
      data,
    });
  }

  update(
    where: Prisma.NewsfeedWhereUniqueInput,
    data: Prisma.NewsfeedUpdateInput,
  ) {
    return this.prismaService.extendedClient().newsfeed.update({
      where,
      data,
    });
  }

  upsert(
    where: Prisma.NewsfeedWhereUniqueInput,
    update: Prisma.NewsfeedUpdateInput,
    create: Prisma.NewsfeedCreateInput,
  ) {
    return this.prismaService.extendedClient().newsfeed.upsert({
      where,
      update,
      create,
    });
  }

  count(where: Prisma.NewsfeedWhereInput) {
    return this.prismaService.extendedClient().newsfeed.count({
      where,
    });
  }

  findMany(
    where: Prisma.NewsfeedWhereInput,
    include: Prisma.NewsfeedInclude,
    skip: number,
    take: number,
  ) {
    return this.prismaService.extendedClient().newsfeed.findMany({
      where,
      include,
      skip,
      take,
    });
  }

  findUnique(
    where: Prisma.NewsfeedWhereUniqueInput,
    include: Prisma.NewsfeedInclude,
  ) {
    return this.prismaService.extendedClient().newsfeed.findUnique({
      where,
      include,
    });
  }

  findUniqueOrThrow(
    where: Prisma.NewsfeedWhereUniqueInput,
    include: Prisma.NewsfeedInclude,
  ) {
    return this.prismaService.extendedClient().newsfeed.findUniqueOrThrow({
      where,
      include,
    });
  }

  delete(where: Prisma.NewsfeedWhereUniqueInput) {
    return this.prismaService.extendedClient().newsfeed.delete({
      where,
    });
  }
}
