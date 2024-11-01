import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class NewsfeedRepository {
  constructor(private readonly prismaService: PrismaService) {}

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

  findMany(where: Prisma.NewsfeedWhereInput, include: Prisma.NewsfeedInclude) {
    return this.prismaService.extendedClient().newsfeed.findMany({
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
