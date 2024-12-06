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

import { TopSellingPhotoDto } from '../dtos/top-selled-photo.dto';
import { TopUsedUpgradePackageDto } from '../dtos/top-used-upgrade-package.dto';
import { DashboardReportRepository } from 'src/database/repositories/dashboard-report.repository';
import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { CameraDto } from 'src/camera/dtos/camera.dto';
import { PhotoSellHistoryRepository } from 'src/database/repositories/photo-sell-history.repository';
import { TopSellerDto } from '../dtos/top-seller.dto';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserDto } from 'src/user/dtos/user.dto';
import { TopSellerDetailDto } from '../dtos/top-seller-detail.dto';
import { TopSoldPhotoDto } from '../dtos/top-sold-photo.dto';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoshootPackageDto } from 'src/photoshoot-package/dtos/photoshoot-package.dto';
import { DashboardReportDto } from '../dtos/dashboard-report.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';

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
    @Inject()
    private readonly cameraRepository: CameraRepository,
    @Inject()
    private readonly photoSellHistoryRepository: PhotoSellHistoryRepository,
    @Inject()
    private readonly photoBuyRepository: PhotoBuyRepository,
    @Inject()
    private readonly userRepository: UserRepository,
    @Inject()
    private readonly photoService: PhotoService,
    @Inject()
    private readonly bookingBillItemRepository: BookingBillItemRepository,
  ) {}

  async getTopSellerDetail(
    id: string,
    dashboardRequestDto: DashboardRequestDto,
  ): Promise<TopSellerDetailDto> {
    const user = await this.userRepository.findUniqueOrThrow(id);

    const topSoldPhotoIds =
      await this.photoRepository.findPhotoIdsByPhotographerIdOrderByPhotoSellingCount(
        user.id,
        dashboardRequestDto.fromDate,
        dashboardRequestDto.toDate,
      );

    const topSoldPhotoPromises = topSoldPhotoIds.map(async (ts) => {
      const topSoldPhotoDto = new TopSoldPhotoDto();
      const photo = await this.photoRepository.findUniqueOrThrow(ts.id);

      topSoldPhotoDto.detail = await this.photoService.signPhoto(photo);
      topSoldPhotoDto.soldCount = ts.count;

      return topSoldPhotoDto;
    });

    const topSoldPhotos = await Promise.all(topSoldPhotoPromises);

    const topPhotoshootPackageEntities =
      await this.photoshootPackageRepository.findAll(
        5,
        0,
        {
          userId: user.id,
          createdAt: {
            lte: dashboardRequestDto.toDate,
            gte: dashboardRequestDto.fromDate,
          },
        },
        [
          {
            bookings: {
              _count: 'desc',
            },
          },
        ],
      );

    const topPhotoshootPackages = plainToInstance(
      PhotoshootPackageDto,
      topPhotoshootPackageEntities,
    );

    const photoSellTransactions = await this.transactionRepository.findAll({
      userId: user.id,
      type: 'IMAGE_SELL',
      status: 'SUCCESS',

      createdAt: {
        lte: dashboardRequestDto.toDate,
        gte: dashboardRequestDto.fromDate,
      },
    });

    const summedPhotoSellRevenues = photoSellTransactions.reduce(
      (acc, s) => acc.add(s.amount.add(s.fee)),
      new Decimal(0),
    );
    const photoSellRevenue = summedPhotoSellRevenues.toNumber();

    const increaseBillItem = await this.bookingBillItemRepository.aggregate({
      where: {
        type: 'INCREASE',
        booking: {
          originalPhotoshootPackage: {
            userId: user.id,
          },
        },
      },
      _sum: {
        price: true,
      },
    });

    const decreaseBillItem = await this.bookingBillItemRepository.aggregate({
      where: {
        type: 'DECREASE',
        booking: {
          originalPhotoshootPackage: {
            userId: user.id,
          },
        },
      },
      _sum: {
        price: true,
      },
    });

    let photoshootPackageRevenue = new Decimal(0);

    if (increaseBillItem._sum.price) {
      photoshootPackageRevenue.add(increaseBillItem._sum.price);
    }

    if (decreaseBillItem._sum.price) {
      photoshootPackageRevenue.sub(decreaseBillItem._sum.price);
    }

    return {
      topPhotoshootPackages,
      photoshootPackageRevenue: photoshootPackageRevenue.toNumber(),
      photoSellRevenue,
      user: plainToInstance(UserDto, user),
      topSoldPhotos,
    };
  }

  async getTopSellers(dashboardRequestDto: DashboardRequestDto) {
    const photographers = await this.keycloakService.findUsersHasRole(
      Constants.PHOTOGRAPHER_ROLE,
      0,
      -1,
    );

    const topSellers: TopSellerDto[] = [];

    for (let photographer of photographers) {
      const totalPhotoSale = await this.photoBuyRepository.count({
        createdAt: {
          lte: dashboardRequestDto.toDate,
          gte: dashboardRequestDto.fromDate,
        },
        photoSellHistory: {
          originalPhotoSell: {
            photo: {
              photographerId: photographer.id,
            },
          },
        },
        userToUserTransaction: {
          fromUserTransaction: {
            status: 'SUCCESS',
          },
        },
      });

      topSellers.push({
        id: photographer.id,
        totalPhotoSale,
        detail: null,
      });
    }

    const sortedTopSellers = topSellers
      .sort((a, b) => b.totalPhotoSale - a.totalPhotoSale)
      .filter((t) => t.totalPhotoSale !== 0)
      .slice(0, 10);

    const mapPromises = sortedTopSellers.map(async (seller) => {
      const user = await this.userRepository.findUniqueOrThrow(seller.id);
      seller.detail = plainToInstance(UserDto, user);

      return seller;
    });

    const dtos = await Promise.all(mapPromises);

    //photo selling revenue
    //booking revenue

    return dtos;
  }

  async generateDashboardData(
    dashboardRequestDto: DashboardRequestDto,
  ): Promise<DashboardReportDto> {
    const startDateTimestamp = dashboardRequestDto.fromDate.getTime();
    const endDateTimestamp = dashboardRequestDto.toDate.getTime();

    const customers = await this.keycloakService.findUsersHasRole(
      Constants.CUSTOMER_ROLE,
      0,
      -1,
    );

    let totalCustomer = customers.filter(
      (c) =>
        c.createdTimestamp >= startDateTimestamp &&
        c.createdTimestamp <= endDateTimestamp,
    ).length;

    const photographers = await this.keycloakService.findUsersHasRole(
      Constants.PHOTOGRAPHER_ROLE,
      0,
      -1,
    );

    let totalPhotographer = photographers.filter(
      (p) =>
        p.createdTimestamp >= startDateTimestamp &&
        p.createdTimestamp <= endDateTimestamp,
    ).length;

    const successPhotoSellingTransactions =
      await this.userToUserTransactionRepository.findMany({
        toUserTransaction: {
          status: 'SUCCESS',
        },
        createdAt: {
          lte: dashboardRequestDto.toDate,
          gte: dashboardRequestDto.fromDate,
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
        createdAt: {
          lte: dashboardRequestDto.toDate,
          gte: dashboardRequestDto.fromDate,
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
      photoType: 'RAW',
      deletedAt: null,
      createdAt: {
        gte: dashboardRequestDto.fromDate,
        lte: dashboardRequestDto.toDate,
      },
    });

    const totalPhotoshootPackage = await this.photoshootPackageRepository.count(
      {
        createdAt: {
          lte: dashboardRequestDto.toDate,
          gte: dashboardRequestDto.fromDate,
        },
      },
    );

    const topUpgradePackages = await this.upgradePackageRepository.findAll(
      0,
      5,
      {
        createdAt: {
          lte: dashboardRequestDto.toDate,
          gte: dashboardRequestDto.fromDate,
        },
      },
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
          createdAt: {
            lte: dashboardRequestDto.toDate,
            gte: dashboardRequestDto.fromDate,
          },
        });

        const upgradePackageDto = plainToInstance(UpgradePackageDto, u);

        return {
          totalUsed,
          upgradePackageDto,
        };
      });
    const topUsedUpgradePackage = await Promise.all(
      topUsedUpgradePackageDtoPromises,
    );

    const topSellingPhotoEntities = await this.photoSellRepository.findMany(
      {
        createdAt: {
          lte: dashboardRequestDto.toDate,
          gte: dashboardRequestDto.fromDate,
        },
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
    const topSellingPhoto: TopSellingPhotoDto[] = topSellingPhotoEntities.map(
      (p) => {
        return {
          totalPhotoSold: p._count.photoSellHistories,
          photo: plainToInstance(SignedPhotoDto, p),
        };
      },
    );

    const totalCamera = await this.cameraRepository.count({
      createdAt: {
        lte: dashboardRequestDto.toDate,
        gte: dashboardRequestDto.fromDate,
      },
    });

    const totalSellingPhoto = await this.photoRepository.count({
      photoSellings: {
        some: {
          active: true,
        },
      },
      deletedAt: null,
    });

    return {
      totalCustomer,
      totalPhotographer,
      totalPhotoshootPackage,
      totalCamera,
      revenueFromUpgradePackage: revenueFromUpgradePackage.toNumber(),
      revenueFromSellingPhoto: revenueFromSellingPhoto.toNumber(),
      totalRevenue: totalRevenue.toNumber(),
      totalPhoto,
      totalSellingPhoto,
      topUsedUpgradePackage,
      topSellingPhoto,
    };
  }
}
