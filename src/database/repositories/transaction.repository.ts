import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async cancelAllPendingOrderTransaction(
    userId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.transaction.updateMany({
      where: {
        userId,
        status: 'PENDING',
      },

      data: {
        status: 'CANCEL',
      },
    });
  }

  async getById(id: string) {
    return this.prisma.transaction.findUnique({
      where: {
        id,
      },
    });
  }

  async updateSuccessTransactionAndActivateUpgradeOrder(
    id: string,
    payload: object,
  ) {
    return this.prisma.transaction.update({
      where: {
        id,
      },
      data: {
        status: 'SUCCESS',
        paymentPayload: payload,
        UpgradeOrder: {
          update: {
            status: 'ACTIVE',
          },
        },
      },
    });
  }
}
