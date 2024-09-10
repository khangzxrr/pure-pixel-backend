import { Injectable } from '@nestjs/common';
import { Prisma, PrismaPromise, UpgradePackage } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UpgradePackageOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async cancelOrderAndTransaction(id: string, tx: Prisma.TransactionClient) {
    return tx.upgradeOrder.update({
      where: {
        id,
      },
      data: {
        status: 'CANCEL',
        transaction: {
          update: {
            status: 'CANCEL',
          },
        },
      },
    });
  }

  async findCurrentUpgradePackageByUserIdOrThrow(userId: string) {
    return this.prisma.upgradeOrder.findFirstOrThrow({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async findManyPendingOrderByUserId(userId: string) {
    return this.prisma.upgradeOrder.findMany({
      where: {
        userId,
        transaction: {
          status: 'PENDING',
        },
      },
    });
  }

  async findCurrentUpgradePackageByUserId(userId: string) {
    return this.prisma.upgradeOrder.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async createUpgradeOrder(
    userId: string,
    upgradePackage: UpgradePackage,
    tx: Prisma.TransactionClient,
  ) {
    return tx.upgradeOrder.create({
      data: {
        description: upgradePackage.description,
        bookingQuotaSize: upgradePackage.bookingQuotaSize,
        quotaSize: upgradePackage.quotaSize,
        price: upgradePackage.price,
        name: upgradePackage.name,
        status: 'PENDING',
        user: {
          connect: {
            id: userId,
          },
        },
        originalUpgradePackage: {
          connect: {
            id: upgradePackage.id,
          },
        },
        transaction: {
          create: {
            user: {
              connect: {
                id: userId,
              },
            },
            amount: upgradePackage.price,
            paymentMethod: 'sepay',
            status: 'PENDING',
            type: 'UPGRADE_TO_PHOTOGRAPHER',
            paymentPayload: {},
          },
        },
      },
    });
  }

  deactivateCurentUpgradePackageByUserId(
    userId: string,
    tx: Prisma.TransactionClient,
  ): PrismaPromise<Prisma.BatchPayload> {
    //TODO: determine should updateMany is a correct workaround for update one order

    return tx.upgradeOrder.updateMany({
      where: {
        userId,
        status: 'EXPIRE',
      },

      data: {
        status: 'EXPIRE',
      },
    });
  }
}
