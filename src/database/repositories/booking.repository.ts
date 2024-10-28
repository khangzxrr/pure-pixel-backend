import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BookingCreateInput) {
    return this.prisma.extendedClient().booking.create({
      data,
    });
  }
  async findFirst(where: Prisma.BookingWhereInput) {
    return this.prisma.extendedClient().booking.findFirst({
      where,
    });
  }

  async count(where: Prisma.BookingWhereInput) {
    return this.prisma.extendedClient().booking.count({
      where,
    });
  }

  async updateById(id: string, data: Prisma.BookingUpdateInput) {
    return this.prisma.extendedClient().booking.update({
      where: {
        id,
      },
      data,
    });
  }

  async findUniqueOrThrow(where: Prisma.BookingWhereUniqueInput) {
    return this.prisma.extendedClient().booking.findUniqueOrThrow({
      where,
      include: {
        originalPhotoshootPackage: {
          include: {
            user: true,
          },
        },
        photoshootPackageHistory: true,
      },
    });
  }

  async findAllWithIncludedPhotoshootPackage(
    skip: number,
    take: number,
    where: Prisma.BookingWhereInput,
  ) {
    return this.prisma.extendedClient().booking.findMany({
      skip,
      take,
      where,
      include: {
        photoshootPackageHistory: true,
        originalPhotoshootPackage: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
