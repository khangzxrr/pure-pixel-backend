import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Decimal } from '@prisma/client/runtime/library';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';
import { UpgradePackageDto } from 'src/upgrade-package/dtos/upgrade-package.dto';
import { DashboardReportDto } from '../dtos/dashboard-report.dto';
import { TopSellingPhotoDto } from '../dtos/top-selled-photo.dto';
import { TopUsedUpgradePackageDto } from '../dtos/top-used-upgrade-package.dto';
import { DashboardReportRepository } from 'src/database/repositories/dashboard-report.repository';

@Injectable()
export class GenerateDashboardReportService {
  constructor(
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject()
    private readonly upgradeOrderRepository: UpgradePackageOrderRepository,
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject()
    private readonly userToUserTransactionRepository: UserToUserRepository,
    @Inject()
    private readonly transactionRepository: TransactionRepository,
    @Inject()
    private readonly photoshootPackageRepository: PhotoshootRepository,
    @Inject()
    private readonly photoSellRepository: PhotoSellRepository,
    @Inject()
    private readonly dashboardReportRepository: DashboardReportRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDashboardData() {
    const customers = await this.keycloakService.findUsersHasRole(
      Constants.CUSTOMER_ROLE,
      0,
      -1,
    );
    const totalCustomer = customers.length;

    const photographers = await this.keycloakService.findUsersHasRole(
      Constants.PHOTOGRAPHER_ROLE,
      0,
      -1,
    );
    const totalPhotographer = photographers.length;

    const managers = await this.keycloakService.findUsersHasRole(
      Constants.MANAGER_ROLE,
      0,
      -1,
    );
    const totalEmployee = managers.length;

    const successPhotoSellingTransactions =
      await this.userToUserTransactionRepository.findMany({
        toUserTransaction: {
          status: 'SUCCESS',
        },
      });
    const revenueFromSellingPhoto: Decimal =
      successPhotoSellingTransactions.reduce(
        (acc, current) => acc.add(current.toUserTransaction.fee),
        new Decimal(0),
      );

    const successUpgradeTransactions = await this.transactionRepository.findAll(
      {
        status: 'SUCCESS',
        type: 'UPGRADE_TO_PHOTOGRAPHER',
        serviceTransaction: {
          isNot: null,
        },
      },
    );
    const revenueFromUpgradePackage = successUpgradeTransactions.reduce(
      //we have to add current and fee because some upgrade transaction may have refund price which converted to fee
      (acc, current) => acc.add(current.amount).add(current.fee),
      new Decimal(0),
    );

    const totalRevenue = revenueFromUpgradePackage.add(revenueFromSellingPhoto);

    const totalPhoto = await this.photoRepository.count({
      status: 'PARSED',
    });

    const totalPhotoshootPackage = await this.photoshootPackageRepository.count(
      {},
    );

    const totalUser = totalCustomer + totalPhotographer;

    const topUpgradePackages = await this.upgradePackageRepository.findAll(
      0,
      5,
      {},
      {
        upgradePackageHistories: {
          _count: 'desc',
        },
      },
    );

    const topUsedUpgradePackageDtoPromises: Promise<TopUsedUpgradePackageDto>[] =
      topUpgradePackages.map(async (u) => {
        const totalUsed = await this.upgradeOrderRepository.count({
          upgradePackageHistory: {
            originalUpgradePackageId: u.id,
          },
          serviceTransaction: {
            transaction: {
              status: 'SUCCESS',
            },
          },
        });

        const upgradePackageDto = plainToInstance(UpgradePackageDto, u);

        return {
          totalUsed,
          upgradePackageDto,
        };
      });
    const topUsedUpgradePackageDtos = await Promise.all(
      topUsedUpgradePackageDtoPromises,
    );

    const topSellingPhoto = await this.photoSellRepository.findMany(
      {
        photoSellHistories: {
          some: {
            photoBuy: {
              some: {
                userToUserTransaction: {
                  fromUserTransaction: {
                    status: 'SUCCESS',
                  },
                },
              },
            },
          },
        },
      },
      [
        {
          photoSellHistories: {
            _count: 'desc',
          },
        },
      ],
      {
        _count: {
          select: {
            photoSellHistories: true,
          },
        },
      },
    );
    const topSellingPhotoDtos: TopSellingPhotoDto[] = topSellingPhoto.map(
      (p) => {
        return {
          totalSelled: p._count.photoSellHistories,
          photo: plainToInstance(SignedPhotoDto, p),
        };
      },
    );

    const dashboardReportDto = new DashboardReportDto(
      totalCustomer,
      totalPhotographer,
      totalEmployee,
      totalRevenue.toNumber(),
      totalPhotoshootPackage,
      revenueFromUpgradePackage.toNumber(),
      revenueFromSellingPhoto.toNumber(),
      totalPhoto,
      totalUser,
      topUsedUpgradePackageDtos,
      topSellingPhotoDtos,
    );

    const createdAt = new Date(new Date().toDateString());

    const dashboardReport = await this.dashboardReportRepository.upsert(
      {
        createdAt,
      },
      {
        data: instanceToPlain(dashboardReportDto),
        createdAt,
      },
      {
        data: instanceToPlain(dashboardReportDto),
        createdAt,
      },
    );

    return dashboardReport;
  }
}
