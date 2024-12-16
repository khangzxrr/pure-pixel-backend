import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class WithdrawalTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  update(
    where: Prisma.WithdrawalTransactionWhereUniqueInput,
    data: Prisma.WithdrawalTransactionUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    if (tx) {
      return tx.withdrawalTransaction.update({
        where,
        data,
      });
    }

    return this.prisma.extendedClient().withdrawalTransaction.update({
      where,
      data,
    });
  }

  findFirst(
    where: Prisma.TransactionWhereInput,
    tx?: Prisma.TransactionClient,
  ) {
    if (tx) {
      return tx.transaction.findFirst({
        where,
      });
    }

    return this.prisma.extendedClient().transaction.findFirst({
      where,
    });
  }

  create(
    userId: string,
    amount: number,
    bankName: string,
    bankNumber: string,
    bankUsername: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (tx) {
      return tx.transaction.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          status: 'PENDING',
          amount,
          paymentPayload: {},
          type: 'WITHDRAWAL',
          paymentMethod: 'WALLET',
          withdrawalTransaction: {
            create: {
              bankName,
              bankUsername,
              bankNumber,
            },
          },
        },
      });
    }

    return this.prisma.extendedClient().transaction.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        status: 'PENDING',
        amount,
        paymentPayload: {},
        type: 'WITHDRAWAL',
        paymentMethod: 'WALLET',
        withdrawalTransaction: {
          create: {
            bankName,
            bankUsername,
            bankNumber,
          },
        },
      },
    });
  }
}
