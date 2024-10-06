import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PhotoBuyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getByPhotoSellIdAndBuyerId(photoSellId: string, buyerId: string) {
    return this.prisma.photoBuy.findFirst({
      where: {
        photoSellId,
        buyerId,
      },
      include: {
        userToUserTransaction: {
          include: {
            transaction: true,
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
  ) {
    return this.prisma.photoBuy.create({
      data: {
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
            transaction: {
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
