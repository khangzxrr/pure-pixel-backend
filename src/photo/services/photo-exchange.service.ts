import { Inject, Injectable } from '@nestjs/common';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { SepayService } from 'src/payment/services/sepay.service';
import { PrismaService } from 'src/prisma.service';
import { plainToInstance } from 'class-transformer';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { CannotBuyOwnedPhotoException } from '../exceptions/cannot-buy-owned-photo.exception';
import { ExistPhotoBuyWithChoosedResolutionException } from '../exceptions/exist-photo-buy-with-choosed-resolution.exception';
import { PrismaPromise } from '@prisma/client';
import { PhotoSellDto } from '../dtos/photo-sell.dto';
import { PhotoService } from './photo.service';
import { PhotoSellPriceTagRepository } from 'src/database/repositories/photo-sell-price-tag.repository';
import { SellQualityNotExistException } from '../exceptions/sell-quality-is-not-exist.exception';
import { PhotoBuyTransactionIsNotSuccessException } from '../exceptions/photo-buy-transaction-is-not-success.exception';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoProcessService } from './photo-process.service';

@Injectable()
export class PhotoExchangeService {
  constructor(
    @Inject() private readonly sepayService: SepayService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoSellRepository: PhotoSellRepository,
    @Inject() private readonly photoBuyRepository: PhotoBuyRepository,
    @Inject()
    private readonly photoSellPriceTagRepository: PhotoSellPriceTagRepository,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    private readonly prisma: PrismaService,
  ) {}

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

    if (photoBuy.photoSellHistory.size === photo.width) {
      return this.photoProcessService.getBufferFromKey(photo.originalPhotoUrl);
    }

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photo.originalPhotoUrl,
    );

    const resizedBuffer = await this.photoProcessService.resizeWithMetadata(
      sharp,
      photoBuy.photoSellHistory.size,
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

    const previousActivePhotoSell = await this.photoSellRepository.findFirst({
      active: true,
      photoId,
    });

    const availableSize =
      await this.photoService.getAvailablePhotoResolution(photoId);

    sellPhotoDto.pricetags.forEach((pricetag) => {
      if (availableSize.indexOf(pricetag.size) < 0) {
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
          create: sellPhotoDto.pricetags,
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
        signedPhotoBuyDto.signedPhotoUrl = `${process.env.BACKEND_ORIGIN}/photo/photo-buy/${photobuy.id}/download-colorgrading`;
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
      photoSellHistory: {
        originalPhotoSell: {
          id: photoSellId,
          pricetags: {
            some: {
              id: pricetagId,
            },
          },
        },
      },
    });

    if (previousPhotoBuy) {
      throw new ExistPhotoBuyWithChoosedResolutionException();
    }

    const priceOfSelectedRes = pricetag.price;
    const fee = priceOfSelectedRes.mul(10).div(100);

    await this.sepayService.validateWalletBalanceIsEnough(
      userId,
      priceOfSelectedRes.toNumber(),
    );

    const newPhotoBuy = await this.photoBuyRepository.createWithTransaction({
      buyer: {
        connect: {
          id: userId,
        },
      },
      photoSellHistory: {
        create: {
          size: pricetag.size,
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
    });

    return plainToInstance(PhotoBuyResponseDto, newPhotoBuy);
  }
}
