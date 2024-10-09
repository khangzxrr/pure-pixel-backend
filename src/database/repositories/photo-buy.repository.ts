import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoBuyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(buyerId: string) {
    return this.prisma.photoBuy.findMany({
      where: {
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

  async findFistById(id: string, buyerId: string) {
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
        photoSell: {
          include: {
            photo: true,
          },
        },
      },
    });
  }

  async findFirst(photoSellId: string, buyerId: string, resolution: string) {
    return this.prisma.photoBuy.findFirst({
      where: {
        photoSellId,
        buyerId,
        resolution,
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

  async createWithTransaction(
    buyerId: string,
    toUserId: string,
    photoSellId: string,
    fee: Prisma.Decimal,
    amount: Prisma.Decimal,
    resolution: string,
  ) {
    return this.prisma.photoBuy.create({
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
      },
      data: {
        resolution,

        buyer: {
          connect: {
            id: buyerId,
          },
        },
        photoSell: {
          connect: {
            id: photoSellId,
          },
        },
        userToUserTransaction: {
          create: {
            toUser: {
              connect: {
                id: toUserId,
              },
            },
            fromUserTransaction: {
              create: {
                type: 'IMAGE_BUY',
                fee,
                user: {
                  connect: {
                    id: buyerId,
                  },
                },
                amount,
                status: 'PENDING',
                paymentMethod: 'SEPAY',
                paymentPayload: {},
              },
            },
          },
        },
      },
    });
  }
}
