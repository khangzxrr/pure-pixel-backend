import { Injectable } from '@nestjs/common';
import { Blog, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(where: Prisma.BlogWhereInput) {
    return this.prisma.blog.count({
      where,
    });
  }

  async findByIdOrThrow(id: string) {
    return this.prisma.blog.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }

  async findAll(findall: Prisma.BlogFindManyArgs) {
    return this.prisma.blog.findMany(findall);
  }

  async create(blog: Prisma.BlogCreateInput) {
    return this.prisma.blog.create({
      data: blog,
    });
  }

  async updateById(id: string, blog: Partial<Blog>) {
    return this.prisma.blog.update({
      where: {
        id,
      },
      data: blog,
    });
  }

  async deleteById(id: string) {
    return this.prisma.blog.delete({
      where: {
        id,
      },
    });
  }
}
