import { Inject, Injectable } from '@nestjs/common';

import { Decimal } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
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

import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { CameraRepository } from 'src/database/repositories/camera.repository';
import { TopSellerDto } from '../dtos/top-seller.dto';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserDto } from 'src/user/dtos/user.dto';
import { TopSellerDetailDto } from '../dtos/top-seller-detail.dto';
import { TopSoldPhotoDto } from '../dtos/top-sold-photo.dto';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoshootPackageDto } from 'src/photoshoot-package/dtos/photoshoot-package.dto';
import { DashboardReportDto } from '../dtos/dashboard-report.dto';

import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';

import { SepayService } from 'src/payment/services/sepay.service';
import { BalanceDto } from '../dtos/balance.dto';

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
    private readonly cameraRepository: CameraRepository,
    @Inject()
    private readonly photoBuyRepository: PhotoBuyRepository,
    @Inject()
    private readonly userRepository: UserRepository,
    @Inject()
    private readonly photoService: PhotoService,
    @Inject()
    private readonly bookingBillItemRepository: BookingBillItemRepository,
    @Inject()
    private readonly sepayService: SepayService,
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
      const photo =
        await this.photoRepository.findUniqueOrThrowIgnoreSoftDelete(ts.id);

      topSoldPhotoDto.detail = await this.photoService.signPhoto(photo);
      topSoldPhotoDto.soldCount = ts.count;

      return topSoldPhotoDto;
    });

    const topSoldPhotos = await Promise.all(topSoldPhotoPromises);

    const topPhotoshootPackageEntities: any[] =
      await this.photoshootPackageRepository.findAllIgnoreSoftDelete(
        {
          userId: user.id,
        },
        [
          {
            bookings: {
              _count: 'desc',
            },
          },
        ],
        {
          _count: {
            select: {
              bookings: {
                where: {
                  status: 'SUCCESSED',
                  createdAt: {
                    lte: dashboardRequestDto.toDate,
                    gte: dashboardRequestDto.fromDate,
                  },
                },
              },
            },
          },
          user: true,
        },
      );

    const topPhotoshootPackages = plainToInstance(
      PhotoshootPackageDto,
      topPhotoshootPackageEntities.sort(
        (p1, p2) => p2._count.bookings - p1._count.bookings,
      ),
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
          status: 'SUCCESSED',
          createdAt: {
            lte: dashboardRequestDto.toDate,
            gte: dashboardRequestDto.fromDate,
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
          status: 'SUCCESSED',
          createdAt: {
            lte: dashboardRequestDto.toDate,
            gte: dashboardRequestDto.fromDate,
          },
        },
      },
      _sum: {
        price: true,
      },
    });

    let photoshootPackageRevenue = new Decimal(0);

    if (increaseBillItem._sum.price) {
      photoshootPackageRevenue = photoshootPackageRevenue.add(
        increaseBillItem._sum.price,
      );
    }

    if (decreaseBillItem._sum.price) {
      photoshootPackageRevenue = photoshootPackageRevenue.sub(
        decreaseBillItem._sum.price,
      );
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

    return dtos;
  }

  async calculateTotalBalance() {
    const successTransactions = await this.transactionRepository.findAll({
      status: 'SUCCESS',
    });
    const totalBalance =
      await this.sepayService.calculateWalletFromTransactions(
        successTransactions,
      );

    const withdrawalTransactions = await this.transactionRepository.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: 'WITHDRAWAL',
        status: 'SUCCESS',
      },
    });

    return plainToInstance(BalanceDto, {
      totalBalance: totalBalance.toNumber(),
      totalWithdrawal: withdrawalTransactions._sum.amount
        ? withdrawalTransactions._sum.amount.toNumber()
        : 0,
    });
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
      9999,
      {
        upgradePackageHistories: {
          some: {
            createdAt: {
              lte: dashboardRequestDto.toDate,
              gte: dashboardRequestDto.fromDate,
            },
          },
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
      OR: [
        {
          photoSellings: {
            some: {
              createdAt: {
                gte: dashboardRequestDto.fromDate,
                lte: dashboardRequestDto.toDate,
              },
            },
          },
          deletedAt: null,
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
        {
          photoSellings: {
            some: {
              createdAt: {
                gte: dashboardRequestDto.fromDate,
                lte: dashboardRequestDto.toDate,
              },
            },
          },
          deletedAt: {
            gte: dashboardRequestDto.toDate,
          },
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
      ],
    });

    const totalRawPhoto = await this.photoRepository.count({
      OR: [
        {
          photoType: 'RAW',
          deletedAt: null,
          photoSellings: {
            none: {
              createdAt: {
                gte: dashboardRequestDto.fromDate,
                lte: dashboardRequestDto.toDate,
              },
            },
          },
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
        {
          photoType: 'RAW',
          deletedAt: {
            gte: dashboardRequestDto.toDate,
          },
          photoSellings: {
            none: {
              createdAt: {
                gte: dashboardRequestDto.fromDate,
                lte: dashboardRequestDto.toDate,
              },
            },
          },
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
      ],
    });

    const totalBookingPhoto = await this.photoRepository.count({
      OR: [
        {
          photoType: 'BOOKING',
          deletedAt: null,
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
        {
          photoType: 'BOOKING',
          deletedAt: {
            gte: dashboardRequestDto.toDate,
          },
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
      ],
    });

    const totalPhoto = await this.photoRepository.count({
      OR: [
        {
          deletedAt: null,
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
        {
          deletedAt: {
            gte: dashboardRequestDto.toDate,
          },
          createdAt: {
            gte: dashboardRequestDto.fromDate,
            lte: dashboardRequestDto.toDate,
          },
        },
      ],
    });

    const bookingSize = await this.photoRepository.aggregate({
      where: {
        OR: [
          {
            deletedAt: null,
            bookingId: {
              not: null,
            },

            createdAt: {
              gte: dashboardRequestDto.fromDate,
              lte: dashboardRequestDto.toDate,
            },
          },
          {
            deletedAt: {
              gte: dashboardRequestDto.toDate,
            },
            bookingId: {
              not: null,
            },

            createdAt: {
              gte: dashboardRequestDto.fromDate,
              lte: dashboardRequestDto.toDate,
            },
          },
        ],
      },
      _sum: {
        size: true,
      },
    });

    const photoSize = await this.photoRepository.aggregate({
      where: {
        OR: [
          {
            deletedAt: null,
            photoType: 'RAW',
            createdAt: {
              gte: dashboardRequestDto.fromDate,
              lte: dashboardRequestDto.toDate,
            },
          },
          {
            deletedAt: {
              gte: dashboardRequestDto.toDate,
            },
            photoType: 'RAW',
            createdAt: {
              gte: dashboardRequestDto.fromDate,
              lte: dashboardRequestDto.toDate,
            },
          },
        ],
      },
      _sum: {
        size: true,
      },
    });

    let totalSize = new Decimal(0);
    if (bookingSize._sum.size) {
      totalSize = totalSize.add(bookingSize._sum.size);
    }
    if (photoSize._sum.size) {
      totalSize = totalSize.add(photoSize._sum.size);
    }

    const withdrawalTransactions = await this.transactionRepository.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: 'WITHDRAWAL',
        status: 'SUCCESS',
        createdAt: {
          gte: dashboardRequestDto.fromDate,
          lte: dashboardRequestDto.toDate,
        },
      },
    });

    const successTransactions = await this.transactionRepository.findAll({
      status: 'SUCCESS',
      createdAt: {
        gte: dashboardRequestDto.fromDate,
        lte: dashboardRequestDto.toDate,
      },
    });
    const totalBalance =
      await this.sepayService.calculateWalletFromTransactions(
        successTransactions,
      );

    const newDashboardReportDto: DashboardReportDto = {
      totalCustomer,
      totalPhotographer,
      totalPhotoshootPackage,
      totalCamera,
      totalBalance: totalBalance.toNumber(),
      totalWithdrawal: withdrawalTransactions._sum.amount
        ? withdrawalTransactions._sum.amount.toNumber()
        : 0,
      revenueFromUpgradePackage: revenueFromUpgradePackage.toNumber(),
      revenueFromSellingPhoto: revenueFromSellingPhoto.toNumber(),
      totalRevenue: totalRevenue.toNumber(),
      totalPhoto,
      totalSize: totalSize.toNumber(),
      totalPhotoSize: photoSize._sum.size ? photoSize._sum.size : 0,
      totalBookingSize: bookingSize._sum.size ? bookingSize._sum.size : 0,
      totalSellingPhoto,
      totalRawPhoto,
      totalBookingPhoto,
      topUsedUpgradePackage,
      topSellingPhoto,
    };

    return newDashboardReportDto;
  }
}
