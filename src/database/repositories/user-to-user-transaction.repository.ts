import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserToUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    return this.prisma.userToUserTransaction.findUnique({
      where: {
        id,
      },
    });
  }

  async findMany(where: Prisma.UserToUserTransactionWhereInput) {
    return this.prisma.extendedClient().userToUserTransaction.findMany({
      where,
      select: {
        id: true,
      },
    });
  }

  async updateById(
    id: string,
    update: Prisma.UserToUserTransactionUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.userToUserTransaction.update({
      where: {
        id,
      },
      data: update,
    });
  }

  async markSucccessAndCreateToUserTransaction(
    id: string,
    paymentPayload: object,
    receiverId: string,
    fee: Prisma.Decimal,
    amount: Prisma.Decimal,
  ) {
    return this.prisma.userToUserTransaction.update({
      where: {
        id,
      },
      data: {
        fromUserTransaction: {
          update: {
            data: {
              status: 'SUCCESS',
              paymentPayload,
              paymentMethod: 'SEPAY',
            },
          },
        },
        toUserTransaction: {
          create: {
            paymentPayload,
            type: 'IMAGE_SELL',
            fee,
            user: {
              connect: {
                id: receiverId,
              },
            },
            amount,
            status: 'SUCCESS',
            paymentMethod: 'WALLET',
          },
        },
      },
    });
  }
}
