import { Inject, Injectable } from '@nestjs/common';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { Prisma } from '@prisma/client';
import { UpgradePackageNotFoundException } from '../exceptions/upgrade-package-not-found-exception';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { PrismaService } from 'src/prisma.service';
import { NotValidExpireDateException } from '../exceptions/not-valid-expired-date.exception';
import { TotalMonthLesserThanMinMonthException } from '../exceptions/total-month-lesser-min-order-month.exception';
import { RequestUpgradeOrderResponseDto } from '../dtos/request-upgrade-order.response.dto';
import { UpgradeOrderDto } from '../dtos/upgrade-order.dto';
import { SepayService } from 'src/payment/services/sepay.service';
import { plainToInstance } from 'class-transformer';
import { UpgradeTransferFeeDto } from '../dtos/upgrade-transfer-fee.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';
import { CannotTransferToTheSameUpgradePackage } from '../exceptions/cannot-transfer-to-the-same-upgrade-package.exception';
import { UpgradeTransferFeeRequestDto } from '../dtos/rest/upgrade-transfer-fee.request.dto';

import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { KeycloakService } from 'src/authen/services/keycloak.service';

@Injectable()
export class UpgradeOrderService {
  constructor(
    @Inject()
    private readonly upgradePackageOrderRepository: UpgradePackageOrderRepository,
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
    @Inject()
    private readonly sepayService: SepayService,
    @Inject() readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    private readonly prisma: PrismaService,
  ) {}

  async findActiveUpgradePackageOrderByUserId(
    userId: string,
  ): Promise<UpgradeOrderDto> {
    const upgradeOrder =
      await this.upgradePackageOrderRepository.findCurrentUpgradePackageByUserId(
        userId,
      );

    if (!upgradeOrder) {
      return null;
    }

    return plainToInstance(UpgradeOrderDto, upgradeOrder);
  }

  private async checkUpgradePackageMustExist(
    requestUpgrade: RequestUpgradeDto,
  ) {
    const upgradePackage = await this.upgradePackageRepository.findFirst({
      id: requestUpgrade.upgradePackageId,
      status: 'ENABLED',
    });

    if (upgradePackage == null) {
      throw new UpgradePackageNotFoundException();
    }

    return upgradePackage;
  }

  async calculateTransferFee(
    userId: string,
    packageId: string,
    upgradeTransferFeeRequestDto: UpgradeTransferFeeRequestDto,
  ): Promise<UpgradeTransferFeeDto> {
    const activatedUpgradeOrder =
      await this.upgradePackageOrderRepository.findCurrentUpgradePackageByUserId(
        userId,
      );

    const upgradePackage = await this.upgradePackageRepository.findFirst({
      id: packageId,
      status: 'ENABLED',
    });

    if (upgradePackage == null) {
      throw new UpgradePackageNotFoundException();
    }

    if (
      upgradeTransferFeeRequestDto.totalMonths < upgradePackage.minOrderMonth
    ) {
      throw new TotalMonthLesserThanMinMonthException();
    }

    if (
      upgradePackage.id ===
      activatedUpgradeOrder?.upgradePackageHistory.originalUpgradePackageId
    ) {
      throw new CannotTransferToTheSameUpgradePackage();
    }

    //70% of activated package of user's total price (upgrade package * totalMonths)
    const maxiumDiscoutPrice = activatedUpgradeOrder
      ? activatedUpgradeOrder.serviceTransaction.transaction.amount
          .mul(70)
          .div(100)
      : new Decimal(0);
    //prevent activatedUpgradeOrder null

    const maxiumDiscoutTimeSpan = 7 * 24 * 60 * 60 * 1000; //one week - cover to millis

    let remainPrice = upgradePackage.price.mul(upgradePackage.minOrderMonth);

    if (!activatedUpgradeOrder) {
      return {
        remainPrice: remainPrice.toNumber(),
        timeSpanPassed: 0,
        discountPrice: 0,
        refundPrice: 0,
        maxiumDiscoutTimeSpan: maxiumDiscoutTimeSpan,
        maxiumDiscoutPrice: maxiumDiscoutPrice.toNumber(),
        upgradePackage: plainToInstance(UpgradePackageDto, upgradePackage),
        currentActivePackage: null,
      };
    }

    const now = new Date();

    const timeSpanRemainOfCurrentUpgradeOrder =
      now.getTime() - activatedUpgradeOrder.createdAt.getTime();

    remainPrice = upgradePackage.price
      .mul(upgradePackage.minOrderMonth)
      .sub(maxiumDiscoutPrice);

    //rare case which user request upgrade to another package instantly (which cannot be real! unless hes superman)
    if (timeSpanRemainOfCurrentUpgradeOrder === 0) {
      return {
        remainPrice: remainPrice.gte(0) ? remainPrice.toNumber() : 0,
        refundPrice: remainPrice.gte(0) ? 0 : remainPrice.abs().toNumber(),
        timeSpanPassed: 0,
        discountPrice: maxiumDiscoutPrice.toNumber(),
        maxiumDiscoutPrice: maxiumDiscoutPrice.toNumber(),
        upgradePackage: plainToInstance(UpgradePackageDto, upgradePackage),
        maxiumDiscoutTimeSpan: maxiumDiscoutTimeSpan,
        currentActivePackage: plainToInstance(
          UpgradeOrderDto,
          activatedUpgradeOrder,
        ),
      };
    }

    if (timeSpanRemainOfCurrentUpgradeOrder >= maxiumDiscoutTimeSpan) {
      return {
        refundPrice: 0,
        remainPrice: upgradePackage.price
          .mul(upgradeTransferFeeRequestDto.totalMonths)
          .toNumber(),
        timeSpanPassed: timeSpanRemainOfCurrentUpgradeOrder,
        discountPrice: 0,
        maxiumDiscoutPrice: maxiumDiscoutPrice.toNumber(),
        upgradePackage: plainToInstance(UpgradePackageDto, upgradePackage),
        maxiumDiscoutTimeSpan: maxiumDiscoutTimeSpan,
        currentActivePackage: plainToInstance(
          UpgradeOrderDto,
          activatedUpgradeOrder,
        ),
      };
    }

    const timediffRatio =
      timeSpanRemainOfCurrentUpgradeOrder / maxiumDiscoutTimeSpan;

    const discoutPercent = new Decimal(1).sub(timediffRatio);
    const discoutRemain = maxiumDiscoutPrice.mul(discoutPercent);

    remainPrice = upgradePackage.price
      .mul(upgradeTransferFeeRequestDto.totalMonths)
      .sub(discoutRemain);

    return {
      remainPrice: remainPrice.gte(0) ? remainPrice.floor().toNumber() : 0,
      refundPrice: remainPrice.gte(0)
        ? 0
        : remainPrice.abs().floor().toNumber(),
      timeSpanPassed: timeSpanRemainOfCurrentUpgradeOrder,
      discountPrice: discoutRemain.floor().toNumber(),
      maxiumDiscoutPrice: maxiumDiscoutPrice.toNumber(),
      maxiumDiscoutTimeSpan: maxiumDiscoutTimeSpan,
      upgradePackage: plainToInstance(UpgradePackageDto, upgradePackage),
      currentActivePackage: plainToInstance(
        UpgradeOrderDto,
        activatedUpgradeOrder,
      ),
    };
  }

  async requestUpgradePayment(
    userId: string,
    requestUpgrade: RequestUpgradeDto,
  ): Promise<RequestUpgradeOrderResponseDto> {
    const upgradePackage =
      await this.checkUpgradePackageMustExist(requestUpgrade);

    const transferDto = await this.calculateTransferFee(
      userId,
      upgradePackage.id,
      {
        totalMonths: requestUpgrade.totalMonths,
      },
    );

    const pendingOrders =
      await this.upgradePackageOrderRepository.findManyPendingOrderByUserId(
        userId,
      );

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

    if (requestUpgrade.paymentMethod === 'WALLET') {
      await this.sepayService.validateWalletBalanceIsEnough(
        userId,
        transferDto.remainPrice,
      );
    }

    const newUpgradeOrder = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const cancelOrderPromises = pendingOrders.map((po) =>
          this.upgradePackageOrderRepository.cancelOrderAndTransaction(
            po.id,
            tx,
          ),
        );

        await Promise.all(cancelOrderPromises);

        if (requestUpgrade.paymentMethod === 'SEPAY') {
          const newUpgradeOrder =
            await this.upgradePackageOrderRepository.createUpgradeOrderByBanking(
              userId,
              upgradePackage,
              expiredDate,
              new Decimal(transferDto.remainPrice),
              //convert discout
              new Decimal(transferDto.discountPrice),
              tx,
            );

          return newUpgradeOrder;
        }

        //create success upgrade order with success transaction and upgrade role customer to photographer
        if (requestUpgrade.paymentMethod === 'WALLET') {
          //only deactivate current pacakge right away when paying with wallet because we know this is a success request
          await this.upgradePackageOrderRepository.deactivateCurentUpgradePackageByUserId(
            userId,
            tx,
          );

          const newUpgradeOrder =
            await this.upgradePackageOrderRepository.createSuccessUpgradeOrderByWallet(
              userId,
              upgradePackage,
              expiredDate,
              new Decimal(transferDto.remainPrice),
              new Decimal(transferDto.discountPrice),
              transferDto,
              tx,
            );

          await this.userRepository.updateMaxQuotaByUserIdTransaction(
            userId,
            upgradePackage.maxPhotoQuota,
            upgradePackage.maxPackageCount,
            tx,
          );

          await this.keycloakService.deleteRolesFromUser(userId);
          await this.keycloakService.addRoleToUser(
            userId,
            Constants.PHOTOGRAPHER_ROLE,
          );

          return newUpgradeOrder;
        }
      },
    );

    const responseDto = plainToInstance(
      RequestUpgradeOrderResponseDto,
      newUpgradeOrder,
    );

    if (requestUpgrade.paymentMethod === 'SEPAY') {
      const paymentDto = await this.sepayService.generatePayment(
        newUpgradeOrder.serviceTransaction.transaction.id,
        newUpgradeOrder.serviceTransaction.transaction.amount.toNumber(),
      );
      responseDto.paymentUrl = paymentDto.paymentUrl;
      responseDto.mockQrCode = paymentDto.mockQrCode;
    }

    return responseDto;
  }
}
