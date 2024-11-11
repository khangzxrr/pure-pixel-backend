import { Injectable } from '@nestjs/common';
import { Prisma, PrismaPromise } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoshootPackage } from '../types/photoshoot-package';

@Injectable()
export class PhotoshootRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findUniqueOrThrow(id: string) {
    return this.prisma.extendedClient().photoshootPackage.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        showcases: true,
        user: true,
        reviews: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
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
    return this.prisma.extendedClient().photoshootPackage.update({
      where: {
        id,
      },
      data: photoshootPackage,
    });
  }

  create(photoshootPackage: Prisma.PhotoshootPackageCreateInput) {
    return this.prisma.extendedClient().photoshootPackage.create({
      data: photoshootPackage,
      include: {
        showcases: true,
        user: true,
        reviews: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
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
  ): Promise<PhotoshootPackage[]> {
    return this.prisma.extendedClient().photoshootPackage.findMany({
      take,
      skip,
      where,

      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
        user: true,
      },
    });
  }
}
