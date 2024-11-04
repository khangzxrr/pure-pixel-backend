import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class NewsfeedLikeRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsert(
    where: Prisma.NewsfeedLikeWhereUniqueInput,
    update: Prisma.NewsfeedLikeUpdateInput,
    create: Prisma.NewsfeedLikeCreateInput,
  ) {
    return this.prismaService.extendedClient().newsfeedLike.upsert({
      where,
      update,
      create,
    });
  }

  create(data: Prisma.NewsfeedLikeCreateInput) {
    return this.prismaService.extendedClient().newsfeedLike.create({
      data,
    });
  }

  findUnique(where: Prisma.NewsfeedLikeWhereUniqueInput) {
    return this.prismaService.extendedClient().newsfeedLike.findUnique({
      where,
    });
  }

  delete(where: Prisma.NewsfeedLikeWhereUniqueInput) {
    return this.prismaService.extendedClient().newsfeedLike.delete({
      where,
    });
  }
}
