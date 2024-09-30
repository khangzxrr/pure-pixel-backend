import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPendingOrderIdTransactionByUserId(
    userId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.serviceTransaction.findMany({
      where: {
        userId,
        upgradeOrder: {
          status: 'PENDING',
        },
      },
      select: {
        id: true,
      },
    });
  }

  async cancelAllPendingOrderTransactionQueries(
    ids: string[],
    tx: Prisma.TransactionClient,
  ) {
    const updatePromises = ids.map((id) => {
      return tx.serviceTransaction.update({
        where: {
          id,
        },

        data: {
          upgradeOrder: {
            update: {
              status: 'CANCEL',
            },
          },
          transaction: {
            update: {
              status: 'CANCEL',
            },
          },
        },
      });
    });

    return updatePromises;
  }

  updateSuccessServiceTransactionAndActivateUpgradeOrder(
    id: string,
    payload: object,
  ) {
    return this.prisma.extendedClient().serviceTransaction.update({
      where: {
        id,
      },
      data: {
        transaction: {
          update: {
            status: 'SUCCESS',
            paymentPayload: payload,
          },
        },
        upgradeOrder: {
          update: {
            status: 'ACTIVE',
          },
        },
      },
    });
  }
}
