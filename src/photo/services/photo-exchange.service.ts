import { Inject, Injectable } from '@nestjs/common';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PrismaService } from 'src/prisma.service';
import { plainToInstance } from 'class-transformer';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { CannotBuyOwnedPhotoException } from '../exceptions/cannot-buy-owned-photo.exception';
import { ExistSuccessedPhotoBuyException } from '../exceptions/exist-photo-buy-with-choosed-resolution.exception';
import { Prisma, PrismaPromise } from '@prisma/client';
import { PhotoSellDto } from '../dtos/photo-sell.dto';
import { PhotoService } from './photo.service';
import { PhotoSellPriceTagRepository } from 'src/database/repositories/photo-sell-price-tag.repository';
import { SellQualityNotExistException } from '../exceptions/sell-quality-is-not-exist.exception';
import { PhotoBuyTransactionIsNotSuccessException } from '../exceptions/photo-buy-transaction-is-not-success.exception';
import { PhotoProcessService } from './photo-process.service';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { SepayService } from 'src/payment/services/sepay.service';

import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';
import { PhotoBuyFindAllDto } from '../dtos/rest/photo-buy-find-all.dto';
import { PhotoBuyFindAllResponseDto } from '../dtos/rest/photo-buy-find-all.response.dto';
import { NotificationService } from 'src/notification/services/notification.service';

@Injectable()
export class PhotoExchangeService {
  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoSellRepository: PhotoSellRepository,
    @Inject()
    private readonly photoBuyRepository: PhotoBuyRepository,
    @Inject()
    private readonly userToUserTransactionRepository: UserToUserRepository,
    @Inject()
    private readonly photoSellPriceTagRepository: PhotoSellPriceTagRepository,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    private readonly prisma: PrismaService,
    @Inject() private readonly sepayService: SepayService,
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  async getAllPreviousBuyPhoto(userId: string, findAllDto: PhotoBuyFindAllDto) {
    const where: Prisma.PhotoWhereInput = {
      photoSellings: {
        some: {
          photoSellHistories: {
            some: {
              photoBuy: {
                some: {
                  buyerId: userId,
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
      },
    };

    const count = await this.photoRepository.count(where);
    const photos = await this.photoRepository.findAll(
      where,
      [],
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    const signedPhotoPromises = photos.map((p) =>
      this.photoService.signPhoto(p),
    );
    const signedPhotos = await Promise.all(signedPhotoPromises);

    const response = new PhotoBuyFindAllResponseDto(
      findAllDto.limit,
      count,
      signedPhotos,
    );

    return response;
  }

  async downloadBoughtPhoto(
    photoId: string,
    userId: string,
    photoBuyId: string,
  ): Promise<Buffer> {
    const photo = await this.photoRepository.findUniqueOrThrow(photoId);
    const photoBuy = await this.photoBuyRepository.findUniqueOrThrow({
      id: photoBuyId,
      buyerId: userId,
    });

    if (
      photoBuy.userToUserTransaction.fromUserTransaction.status !== 'SUCCESS'
    ) {
      throw new PhotoBuyTransactionIsNotSuccessException();
    }

    if (
      photoBuy.photoSellHistory.width === photo.width &&
      photoBuy.photoSellHistory.height === photo.height
    ) {
      return this.photoProcessService.getBufferFromKey(photo.originalPhotoUrl);
    }

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photo.originalPhotoUrl,
    );

    const resizedBuffer = await this.photoProcessService.resizeWithMetadata(
      sharp,
      photoBuy.photoSellHistory.width,
    );

    return resizedBuffer;
  }

  async sellPhoto(
    userId: string,
    photoId: string,
    sellPhotoDto: CreatePhotoSellingDto,
  ) {
    const photo =
      await this.photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        photoId,
      );

    if (photo.status === 'DUPLICATED') {
      throw new FailToPerformOnDuplicatedPhotoException();
    }

    const previousActivePhotoSell = await this.photoSellRepository.findFirst({
      active: true,
      photoId,
    });

    const availableSize =
      await this.photoService.getAvailablePhotoResolution(photoId);

    sellPhotoDto.pricetags.forEach((pricetag) => {
      if (
        availableSize.findIndex(
          (s) => s.width === pricetag.width && s.height === pricetag.height,
        ) < 0
      ) {
        throw new SellQualityNotExistException();
      }
    });

    if (photo.watermarkPhotoUrl === '') {
      await this.photoService.sendImageWatermarkQueue(userId, photoId, {
        text: 'PXL',
      });
    }

    const prismaQuery: PrismaPromise<any>[] = [];
    if (previousActivePhotoSell) {
      const updatePreviousPhotoSellQuery =
        this.photoSellRepository.deactivatePhotoSellByPhotoIdQuery(photoId);
      prismaQuery.push(updatePreviousPhotoSellQuery);
    }

    const updatePhotoToPublicAndWatermarkQuery =
      this.photoRepository.updateQueryById(photoId, {
        watermark: true,
        visibility: 'PUBLIC',
        title: sellPhotoDto.title,
        description: sellPhotoDto.description,
      });
    prismaQuery.push(updatePhotoToPublicAndWatermarkQuery);

    const createPhotoSellQuery =
      this.photoSellRepository.createAndActiveByPhotoIdQuery({
        active: true,
        description: sellPhotoDto.description,
        photo: {
          connect: {
            id: photoId,
          },
        },
        pricetags: {
          create: sellPhotoDto.pricetags.map((p) => {
            return {
              width: p.width,
              height: p.height,
              price: p.price,
            };
          }),
        },
      });
    prismaQuery.push(createPhotoSellQuery);

    const results = await this.prisma
      .extendedClient()
      .$transaction([...prismaQuery]);

    return plainToInstance(PhotoSellDto, results.pop());
  }

  async getPhotoBuyByPhotoId(userId: string, photoId: string) {
    const previousPhotoBuys =
      await this.photoBuyRepository.findAllByBuyerIdAndPhotoId(userId, photoId);

    const mappingToDtoPromises = previousPhotoBuys.map(async (photobuy) => {
      const signedPhotoBuyDto = plainToInstance(SignedPhotoBuyDto, photobuy);

      if (
        photobuy.userToUserTransaction.fromUserTransaction.status === 'SUCCESS'
      ) {
        signedPhotoBuyDto.downloadUrl = `${process.env.BACKEND_ORIGIN}/photo/${photoId}/photo-buy/${photobuy.id}/download`;
      }

      return signedPhotoBuyDto;
    });

    const signedPhotoBuyDtos = await Promise.all(mappingToDtoPromises);

    return signedPhotoBuyDtos;
  }

  async buyPhotoRequest(
    userId: string,
    photoId: string,
    photoSellId: string,
    pricetagId: string,
    buyPhotoDto: BuyPhotoRequestDto,
  ) {
    const photoSell = await this.photoSellRepository.findUniqueOrThrow({
      id: photoSellId,
      photoId,
      active: true,
    });

    if (photoSell.photo.photographerId === userId) {
      throw new CannotBuyOwnedPhotoException();
    }

    const pricetag = await this.photoSellPriceTagRepository.findUniqueOrThrow({
      photoSellId,
      id: pricetagId,
    });

    const previousPhotoBuy = await this.photoBuyRepository.findFirst({
      buyer: {
        id: userId,
      },
      userToUserTransaction: {
        fromUserTransaction: {
          userId,
          status: 'SUCCESS',
        },
      },
      photoSellHistory: {
        width: pricetag.width,
        height: pricetag.height,
        originalPhotoSell: {
          id: photoSellId,
        },
      },
    });

    if (previousPhotoBuy) {
      throw new ExistSuccessedPhotoBuyException();
    }

    const priceOfSelectedRes = pricetag.price;
    const fee = priceOfSelectedRes.mul(10).div(100);

    const previousPendingTransaction =
      await this.userToUserTransactionRepository.findMany({
        photoBuy: {
          buyerId: userId,
          photoSellHistory: {
            width: pricetag.width,
            height: pricetag.height,
            price: pricetag.price,
            originalPhotoSellId: photoSell.id,
          },
        },
        fromUserTransaction: {
          status: 'PENDING',
        },
      });

    return await this.prisma.$transaction(async (tx) => {
      previousPendingTransaction.forEach(
        async (p) =>
          await this.userToUserTransactionRepository.updateById(
            p.id,
            {
              fromUserTransaction: {
                update: {
                  data: {
                    status: 'CANCEL',
                  },
                },
              },
            },
            tx,
          ),
      );

      if (buyPhotoDto.paymentMethod === 'WALLET') {
        await this.sepayService.validateWalletBalanceIsEnough(
          userId,
          priceOfSelectedRes.toNumber(),
        );

        const newPhotoBuyByWallet =
          await this.photoBuyRepository.createWithTransaction(
            {
              buyer: {
                connect: {
                  id: userId,
                },
              },
              photoSellHistory: {
                create: {
                  width: pricetag.width,
                  height: pricetag.height,
                  price: pricetag.price,
                  description: photoSell.description,
                  originalPhotoSell: {
                    connect: {
                      id: photoSell.id,
                    },
                  },
                },
              },
              userToUserTransaction: {
                create: {
                  toUser: {
                    connect: {
                      id: photoSell.photo.photographerId,
                    },
                  },
                  toUserTransaction: {
                    create: {
                      paymentPayload: '',
                      type: 'IMAGE_SELL',
                      fee,
                      user: {
                        connect: {
                          id: photoSell.photo.photographerId,
                        },
                      },
                      amount: pricetag.price,
                      status: 'SUCCESS',
                      paymentMethod: 'WALLET',
                    },
                  },
                  fromUserTransaction: {
                    create: {
                      type: 'IMAGE_BUY',
                      fee,
                      user: {
                        connect: {
                          id: userId,
                        },
                      },
                      amount: pricetag.price,
                      status: 'SUCCESS',
                      paymentMethod: 'WALLET',
                      paymentPayload: {},
                    },
                  },
                },
              },
            },
            tx,
          );

        await this.notificationService.addNotificationToQueue({
          title: `Mua ảnh ${photoSell.photo.title} thành công`,
          content: `Bạn đã thanh toán ảnh ${photoSell.photo.title} - kích thước ${pricetag.width}x${pricetag.height} bằng ví thành công`,
          userId: userId,
          type: 'BOTH_INAPP_EMAIL',
          referenceType: 'PHOTO_BUY',
          payload: newPhotoBuyByWallet,
        });

        return plainToInstance(PhotoBuyResponseDto, newPhotoBuyByWallet);
      }

      const newPhotoBuyBySepay =
        await this.photoBuyRepository.createWithTransaction(
          {
            buyer: {
              connect: {
                id: userId,
              },
            },
            photoSellHistory: {
              create: {
                width: pricetag.width,
                height: pricetag.height,
                price: pricetag.price,
                description: photoSell.description,
                originalPhotoSell: {
                  connect: {
                    id: photoSell.id,
                  },
                },
              },
            },
            userToUserTransaction: {
              create: {
                toUser: {
                  connect: {
                    id: photoSell.photo.photographerId,
                  },
                },
                fromUserTransaction: {
                  create: {
                    type: 'IMAGE_BUY',
                    fee,
                    user: {
                      connect: {
                        id: userId,
                      },
                    },
                    amount: pricetag.price,
                    status: 'PENDING',
                    paymentMethod: 'SEPAY',
                    paymentPayload: {},
                  },
                },
              },
            },
          },
          tx,
        );

      const photoBuyResponseDto = plainToInstance(
        PhotoBuyResponseDto,
        newPhotoBuyBySepay,
      );

      const paymentUrl = this.sepayService.generatePaymentUrl(
        newPhotoBuyBySepay.userToUserTransaction.fromUserTransaction.id,
        newPhotoBuyBySepay.userToUserTransaction.fromUserTransaction.amount.toNumber(),
      );
      const mockQrcode = await this.sepayService.generateMockIpnQrCode(
        newPhotoBuyBySepay.userToUserTransaction.fromUserTransaction.id,
        newPhotoBuyBySepay.userToUserTransaction.fromUserTransaction.amount.toNumber(),
      );

      photoBuyResponseDto.paymentUrl = paymentUrl;
      photoBuyResponseDto.mockQrCode = mockQrcode;

      return photoBuyResponseDto;
    });
  }
}
