import { Injectable } from '@nestjs/common';
import { Prisma, PrismaPromise } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { PhotoBuyDetail } from '../types/photo-buy';

@Injectable()
export class PhotoBuyRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.PhotoBuyWhereInput) {
    return this.prisma.photoBuy.count({
      where,
    });
  }

  findAll(where: Prisma.PhotoBuyWhereInput): PrismaPromise<PhotoBuyDetail[]> {
    return this.prisma.photoBuy.findMany({
      where,
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
        photoSellHistory: {
          include: {
            originalPhotoSell: true,
          },
        },
      },
    });
  }

  async findFirstById(id: string, buyerId: string) {
    return this.prisma.photoBuy.findFirst({
      where: {
        id,
        buyerId,
      },
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
      },
    });
  }

  async findUniqueOrThrow(where: Prisma.PhotoBuyWhereUniqueInput) {
    return this.prisma.photoBuy.findUniqueOrThrow({
      where,
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
        photoSellHistory: true,
      },
    });
  }

  async findFirst(where: Prisma.PhotoBuyWhereInput) {
    return this.prisma.photoBuy.findFirst({
      where,
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
      },
    });
  }

  async createWithTransaction(
    data: Prisma.PhotoBuyCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.photoBuy.create({
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
      },
      data,
    });
  }
}
