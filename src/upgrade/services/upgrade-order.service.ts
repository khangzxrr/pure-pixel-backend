import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { CurrentUpgradePackageOrderNotFound } from '../exceptions/current-upgrade-package-order-not-found.exception';
import { UnhandledException } from 'src/infrastructure/exceptions/unhandled-exception';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UserHasActivatedUpgradePackage } from '../exceptions/user-has-activated-upgrade-package-exception';
import { Prisma, UpgradePackageStatus } from '@prisma/client';
import { UpgradePackageNotFoundException } from '../exceptions/upgrade-package-not-found-exception';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { PrismaService } from 'src/prisma.service';
import { ExistPendingOrderException as ExistPendingUpgradeOrderException } from '../exceptions/exist-pending-order-exception';
import { NotValidExpireDateException } from '../exceptions/not-valid-expired-date.exception';

@Injectable()
export class UpgradeOrderService {
  constructor(
    @Inject()
    private readonly upgradePackageOrderRepository: UpgradePackageOrderRepository,
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
    private readonly prisma: PrismaService,
  ) {}

  //TODO: cron job check expire time of upgrade package

  async findActiveUpgradePackageOrderByUserId(userId: string) {
    try {
      return await this.upgradePackageOrderRepository.findCurrentUpgradePackageByUserIdOrThrow(
        userId,
      );
    } catch (e) {
      if (e.code === 'P2025') {
        throw new CurrentUpgradePackageOrderNotFound();
      }

      throw new UnhandledException(e);
    }
  }
  async requestUpgradePayment(
    userId: string,
    requestUpgrade: RequestUpgradeDto,
  ) {
    console.log(userId, requestUpgrade);

    //check if user has activated upgrade package
    //=================
    const activedUpgradePackage =
      await this.upgradePackageOrderRepository.findCurrentUpgradePackageByUserId(
        userId,
      );

    if (activedUpgradePackage != null && !requestUpgrade.acceptTransfer) {
      throw new UserHasActivatedUpgradePackage();
    }
    //===================================================================

    //TODO: handle transfer upgrade packages
    //

    //check if upgrade package id supplied is exist
    const upgradePackage = await this.upgradePackageRepository.findById(
      requestUpgrade.upgradePackageId,
      UpgradePackageStatus.ENABLED,
    );

    if (upgradePackage == null) {
      throw new UpgradePackageNotFoundException();
    }
    //============================================================

    const pendingOrders =
      await this.upgradePackageOrderRepository.findManyPendingOrderByUserId(
        userId,
      );

    if (
      pendingOrders.length > 0 &&
      !requestUpgrade.acceptRemovePendingUpgradeOrder
    ) {
      throw new ExistPendingUpgradeOrderException();
    }

    const currentDate = new Date();
    const expiredDate = new Date(
      currentDate.setMonth(currentDate.getMonth() + requestUpgrade.totalMonths),
    );

    //should we believe in class-validator?
    //absolutely not
    if (expiredDate < currentDate) {
      throw new NotValidExpireDateException();
    }
    const upgradeOrder = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const cancelOrderPromises = pendingOrders.map((po) =>
          this.upgradePackageOrderRepository.cancelOrderAndTransaction(
            po.id,
            tx,
          ),
        );

        await Promise.all(cancelOrderPromises);

        await this.upgradePackageOrderRepository.deactivateCurentUpgradePackageByUserId(
          userId,
          tx,
        );

        const newUpgradeOrder =
          await this.upgradePackageOrderRepository.createUpgradeOrder(
            userId,
            upgradePackage,
            expiredDate,
            tx,
          );

        return newUpgradeOrder;
      },
    );

    return upgradeOrder;
  }
}
