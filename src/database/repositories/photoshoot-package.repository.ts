import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUniqueOrThrow(id: string) {
    return this.prisma.extendedClient().photoshootPackage.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        user: true,
        details: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.extendedClient().photoshootPackage.delete({
      where: {
        id,
      },
    });
  }

  async updateById(
    id: string,
    photoshootPackage: Prisma.PhotoshootPackageUpdateInput,
  ) {
    this.prisma.extendedClient().photoshootPackage.update({
      where: {
        id,
      },
      data: photoshootPackage,
    });
  }

  create(photoshootPackage: Prisma.PhotoshootPackageCreateInput) {
    return this.prisma.extendedClient().photoshootPackage.create({
      data: photoshootPackage,
    });
  }

  async count(where: Prisma.PhotoshootPackageWhereInput) {
    return this.prisma.extendedClient().photoshootPackage.count({
      where,
    });
  }

  async findAll(
    take: number,
    skip: number,
    where: Prisma.PhotoshootPackageWhereInput,
  ) {
    return this.prisma.extendedClient().photoshootPackage.findMany({
      take,
      skip,
      where,
      include: {
        details: true,
        user: true,
      },
    });
  }
}
