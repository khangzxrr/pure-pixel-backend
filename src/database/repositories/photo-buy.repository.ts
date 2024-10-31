import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoBuyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByBuyerIdAndPhotoId(buyerId: string, photoId: string) {
    return this.prisma.photoBuy.findMany({
      where: {
        buyerId,
        photoSellHistory: {
          originalPhotoSell: {
            photoId,
          },
        },
      },
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
