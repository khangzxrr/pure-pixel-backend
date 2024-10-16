import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoshootRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: string) {
    return this.prisma.photoshootPackage.delete({
      where: {
        id,
      },
    });
  }

  async updateById(
    id: string,
    photoshootPackage: Prisma.PhotoshootPackageUpdateInput,
  ) {
    this.prisma.photoshootPackage.update({
      where: {
        id,
      },
      data: photoshootPackage,
    });
  }

  async create(photoshootPackage: Prisma.PhotoshootPackageCreateInput) {
    return this.prisma.photoshootPackage.create({
      data: photoshootPackage,
    });
  }

  async count(where: Prisma.PhotoshootPackageWhereInput) {
    return this.prisma.photoshootPackage.count({
      where,
    });
  }

  async findAll(
    take: number,
    skip: number,
    where: Prisma.PhotoshootPackageWhereInput,
  ) {
    return this.prisma.photoshootPackage.findMany({
      take,
      skip,
      where,
    });
  }
}
