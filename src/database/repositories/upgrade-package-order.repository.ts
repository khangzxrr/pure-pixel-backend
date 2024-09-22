import { Injectable } from '@nestjs/common';
import { Prisma, PrismaPromise, UpgradePackage } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UpgradePackageOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

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
        transaction: {
          update: {
            status: 'CANCEL',
          },
        },
      },
    });
  }

  async findCurrentUpgradePackageByUserIdOrThrow(userId: string) {
    return this.prisma.upgradeOrder.findFirst({
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
    expiredAt: Date,
    calculatedPrice: Prisma.Decimal,
    tx: Prisma.TransactionClient,
  ) {
    return tx.upgradeOrder.create({
      data: {
        expiredAt,

        descriptions: upgradePackage.descriptions,
        price: upgradePackage.price,
        name: upgradePackage.name,
        maxPhotoCount: upgradePackage.maxPhotoCount,
        maxPackageCount: upgradePackage.maxPackageCount,
        maxBookingPhotoCount: upgradePackage.maxBookingPhotoCount,
        maxBookingVideoCount: upgradePackage.maxBookingVideoCount,
        minOrderMonth: upgradePackage.minOrderMonth,
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
            amount: calculatedPrice,
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
