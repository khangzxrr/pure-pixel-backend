import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class NewsfeedCommentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: Prisma.NewsfeedCommentCreateInput) {
    return this.prismaService.extendedClient().newsfeedComment.create({
      data,
    });
  }

  findMany(
    where: Prisma.NewsfeedCommentWhereInput,
    include: Prisma.NewsfeedCommentInclude,
    skip: number,
    take: number,
  ) {
    return this.prismaService.extendedClient().newsfeedComment.findMany({
      where,
      skip,
      take,
      include,
    });
  }

  delete(where: Prisma.NewsfeedCommentWhereUniqueInput) {
    return this.prismaService.extendedClient().newsfeedComment.delete({
      where,
    });
  }

  update(
    where: Prisma.NewsfeedCommentWhereUniqueInput,
    data: Prisma.NewsfeedCommentUpdateInput,
  ) {
    return this.prismaService.extendedClient().newsfeedComment.update({
      where,
      data,
    });
  }
}
