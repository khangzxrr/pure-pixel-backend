import { Injectable } from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  PrismaPromise,
  UpgradePackage,
} from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UpgradePackageOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.extendedClient().upgradeOrder.findUnique({
      where: {
        id,
      },
    });
  }

  async count(where: Prisma.UpgradeOrderWhereInput) {
    return this.prisma.extendedClient().upgradeOrder.count({
      where,
    });
  }

  async findManyActivateOrder() {
    return this.prisma.upgradeOrder.findMany({
      where: {
        status: 'ACTIVE',
      },
    });
  }

  async findManyActivateAndExpired(date: Date) {
    return this.prisma.upgradeOrder.findMany({
      where: {
        expiredAt: {
          lte: date,
        },
        status: 'ACTIVE',
      },
    });
  }

  async deactivateActivatedAndExpired(date: Date) {
    return this.prisma.upgradeOrder.updateMany({
      where: {
        expiredAt: {
          lte: date,
        },
        status: 'ACTIVE',
      },

      data: {
        status: 'EXPIRE',
      },
    });
  }

  async cancelOrderAndTransaction(id: string, tx: Prisma.TransactionClient) {
    return tx.upgradeOrder.update({
      where: {
        id,
      },
      data: {
        status: 'CANCEL',
        serviceTransaction: {
          update: {
            transaction: {
              update: {
                status: 'CANCEL',
              },
            },
          },
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
      include: {
        upgradePackageHistory: {
          include: {
            originalUpgradePackage: true,
          },
        },
        serviceTransaction: {
          include: {
            transaction: true,
          },
        },
      },
    });
  }

  async findManyPendingOrderByUserId(userId: string) {
    return this.prisma.upgradeOrder.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
    });
  }

  async createUpgradeOrder(
    userId: string,
    upgradePackage: UpgradePackage,
    expiredAt: Date,
    amount: Prisma.Decimal,
    refundAmount: Prisma.Decimal,
    paymentMethod: PaymentMethod,
    tx: Prisma.TransactionClient,
  ) {
    return tx.upgradeOrder.create({
      select: {
        id: true,
        serviceTransaction: {
          select: {
            transactionId: true,
          },
        },
        upgradePackageHistory: {
          select: {
            id: true,
          },
        },
      },
      data: {
        expiredAt,
        status: 'PENDING',
        user: {
          connect: {
            id: userId,
          },
        },
        upgradePackageHistory: {
          create: {
            originalUpgradePackage: {
              connect: {
                id: upgradePackage.id,
              },
            },
            price: upgradePackage.price,
            name: upgradePackage.name,
            descriptions: upgradePackage.descriptions,
            maxPhotoQuota: upgradePackage.maxPhotoQuota,
            minOrderMonth: upgradePackage.minOrderMonth,
            maxPackageCount: upgradePackage.maxPackageCount,
          },
        },
        serviceTransaction: {
          create: {
            transaction: {
              create: {
                user: {
                  connect: {
                    id: userId,
                  },
                },
                type: 'UPGRADE_TO_PHOTOGRAPHER',
                amount,
                fee: refundAmount,
                paymentMethod,
                status: 'PENDING',
                paymentPayload: {},
              },
            },
          },
        },
      },
    });
  }

  deactivateCurentUpgradePackageByUserId(
    userId: string,
    tx: Prisma.TransactionClient,
  ): PrismaPromise<Prisma.BatchPayload> {
    //should using updateMany to deactivate all current active upgradePackage
    //but we only allow one package at a time?
    //maybe we will change that later, this method will also perform correctly
    return tx.upgradeOrder.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },

      data: {
        status: 'EXPIRE',
      },
    });
  }
}
