import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany();
  }

  async findMany(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.findMany({
      where,
    });
  }

  async findById(id: string) {
    return this.prisma.category.findFirst({
      where: {
        id,
      },
    });
  }
}
