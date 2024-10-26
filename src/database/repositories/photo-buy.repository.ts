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
        photoSell: {
          photoId,
        },
      },
      include: {
        userToUserTransaction: {
          include: {
            fromUserTransaction: true,
          },
        },
        photoSell: true,
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
        photoSell: true,
      },
    });
  }

  async findFirst(photoSellId: string, buyerId: string, size: number) {
    return this.prisma.photoBuy.findFirst({
      where: {
        photoSellId,
        buyerId,
        size,
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
    size: number,
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
        size,

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
