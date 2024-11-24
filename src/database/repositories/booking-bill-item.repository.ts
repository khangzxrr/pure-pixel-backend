import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BookingBillItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(where: Prisma.BookingBillItemWhereInput) {
    return this.prisma.extendedClient().bookingBillItem.count({
      where,
    });
  }

  async deleteById(bookingId: string, id: string) {
    return this.prisma.extendedClient().bookingBillItem.delete({
      where: {
        id,
        bookingId,
      },
    });
  }

  async updateById(id: string, data: Prisma.BookingBillItemUpdateInput) {
    return this.prisma.extendedClient().bookingBillItem.update({
      where: {
        id,
      },
      data,
    });
  }

  async create(data: Prisma.BookingBillItemCreateInput) {
    return this.prisma.extendedClient().bookingBillItem.create({
      data,
    });
  }

  async aggregate(args: Prisma.BookingBillItemAggregateArgs) {
    return this.prisma.extendedClient().bookingBillItem.aggregate(args);
  }

  async findMany(
    skip: number,
    take: number,
    where: Prisma.BookingBillItemWhereInput,
  ) {
    return this.prisma.extendedClient().bookingBillItem.findMany({
      skip,
      take,
      where,
    });
  }
}
