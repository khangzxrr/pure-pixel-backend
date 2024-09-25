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
      include: {
        upgradeOrder: true,
      },
    });
  }

  updateSuccessTransactionAndActivateUpgradeOrder(id: string, payload: object) {
    return this.prisma.extendedClient().transaction.update({
      where: {
        id,
      },
      data: {
        status: 'SUCCESS',
        paymentPayload: payload,
        upgradeOrder: {
          update: {
            status: 'ACTIVE',
          },
        },
      },
    });
  }
}
