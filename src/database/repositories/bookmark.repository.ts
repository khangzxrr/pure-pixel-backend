import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BookmarkRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(
    where: Prisma.BookmarkWhereInput,
    include: Prisma.BookmarkInclude<DefaultArgs>,
    skip: number,
    take: number,
  ) {
    return this.prismaService.bookmark.findMany({
      where,
      skip,
      take,
      include,
    });
  }

  upsert(
    where: Prisma.BookmarkWhereUniqueInput,
    data: Prisma.BookmarkCreateInput,
  ) {
    return this.prismaService.bookmark.upsert({
      where,
      update: {},
      create: data,
    });
  }

  delete(where: Prisma.BookmarkWhereUniqueInput) {
    return this.prismaService.bookmark.delete({
      where,
    });
  }
}
