import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UserHasActivatedUpgradePackage } from '../exceptions/user-has-activated-upgrade-package-exception';
import { Prisma } from '@prisma/client';
import { UpgradePackageNotFoundException } from '../exceptions/upgrade-package-not-found-exception';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { PrismaService } from 'src/prisma.service';
import { ExistPendingOrderException as ExistPendingUpgradeOrderException } from '../exceptions/exist-pending-order-exception';
import { NotValidExpireDateException } from '../exceptions/not-valid-expired-date.exception';
import { TotalMonthLesserThanMinMonthException } from '../exceptions/total-month-lesser-min-order-month.exception';
import { RequestUpgradeOrderResponseDto } from '../dtos/request-upgrade-order.response.dto';
import { UpgradeOrderDto } from '../dtos/upgrade-order.dto';
import { SepayService } from 'src/payment/services/sepay.service';

@Injectable()
export class UpgradeOrderService {
  constructor(
    @Inject()
    private readonly upgradePackageOrderRepository: UpgradePackageOrderRepository,
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
    @Inject()
    private readonly sepayService: SepayService,
    private readonly prisma: PrismaService,
  ) {}

  async findActiveUpgradePackageOrderByUserId(
    userId: string,
  ): Promise<UpgradeOrderDto> {
    const upgradeOrder =
      await this.upgradePackageOrderRepository.findCurrentUpgradePackageByUserIdOrThrow(
        userId,
      );

    if (!upgradeOrder) {
      return null;
    }

    return new UpgradeOrderDto(upgradeOrder);
  }

  private async checkIfUserHasActivatedOrderWithoutAcceptTransfer(
    userId: string,
    requestUpgrade: RequestUpgradeDto,
  ) {
    const activedUpgradePackage =
      await this.upgradePackageOrderRepository.findCurrentUpgradePackageByUserId(
        userId,
      );

    if (activedUpgradePackage != null && !requestUpgrade.acceptTransfer) {
      throw new UserHasActivatedUpgradePackage();
    }
  }

  private async checkUpgradePackageMustExist(
    requestUpgrade: RequestUpgradeDto,
  ) {
    const upgradePackage = await this.upgradePackageRepository.findUnique({
      id: requestUpgrade.upgradePackageId,
      status: 'ENABLED',
    });

    if (upgradePackage == null) {
      throw new UpgradePackageNotFoundException();
    }

    return upgradePackage;
  }

  private async checkPendingOrderAndAcceptCancelPending(
    userId: string,
    requestUpgrade: RequestUpgradeDto,
  ) {
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

    return pendingOrders;
  }

  async requestUpgradePayment(
    userId: string,
    requestUpgrade: RequestUpgradeDto,
  ): Promise<RequestUpgradeOrderResponseDto> {
    await this.checkIfUserHasActivatedOrderWithoutAcceptTransfer(
      userId,
      requestUpgrade,
    );

    const upgradePackage =
      await this.checkUpgradePackageMustExist(requestUpgrade);

    const pendingOrders = await this.checkPendingOrderAndAcceptCancelPending(
      userId,
      requestUpgrade,
    );

    //TODO: handle transfer upgrade packages

    if (requestUpgrade.totalMonths < upgradePackage.minOrderMonth) {
      throw new TotalMonthLesserThanMinMonthException();
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

    const calculatedPrice = upgradePackage.price.mul(
      new Prisma.Decimal(requestUpgrade.totalMonths),
    );

    return await this.prisma.$transaction(
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
            calculatedPrice,
            'SEPAY',
            tx,
          );

        const paymentUrl = this.sepayService.generatePaymentUrl(
          newUpgradeOrder.id,
          calculatedPrice.toNumber(),
        );

        const requestUpgradeResponse = new RequestUpgradeOrderResponseDto();
        requestUpgradeResponse.id = newUpgradeOrder.id;

        //IMPORTANT: must using transactionId instead of serviceTransactionId
        requestUpgradeResponse.transactionId =
          newUpgradeOrder.serviceTransaction.transactionId;

        requestUpgradeResponse.upgradePackageHistoryId =
          newUpgradeOrder.upgradePackageHistory.id;
        requestUpgradeResponse.paymentQrcodeUrl = paymentUrl;

        //IMPORTANT: must using transactionId instead of serviceTransactionId
        requestUpgradeResponse.mockQrcode =
          await this.sepayService.generateMockIpnQrCode(
            newUpgradeOrder.serviceTransaction.transactionId,
            calculatedPrice.toNumber(),
          );

        return requestUpgradeResponse;
      },
    );
  }
}
