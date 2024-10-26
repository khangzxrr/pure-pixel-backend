import { Inject, Injectable } from '@nestjs/common';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { SepayService } from 'src/payment/services/sepay.service';
import { PrismaService } from 'src/prisma.service';
import { plainToInstance } from 'class-transformer';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { BuyQualityIsNotExistException } from '../exceptions/buy-quality-is-not-exist.exception';
import { CannotBuyOwnedPhotoException } from '../exceptions/cannot-buy-owned-photo.exception';
import { ExistPhotoBuyWithChoosedResolutionException } from '../exceptions/exist-photo-buy-with-choosed-resolution.exception';
import { PhotoSellNotFoundException } from '../exceptions/photo-sell-not-found.exception';
import { PrismaPromise } from '@prisma/client';
import { PhotoSellDto } from '../dtos/photo-sell.dto';
import { PhotoSellEntity } from '../entities/photo-sell.entity';
import { PhotoService } from './photo.service';

@Injectable()
export class PhotoExchangeService {
  constructor(
    @Inject() private readonly sepayService: SepayService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoSellRepository: PhotoSellRepository,
    @Inject() private readonly photoBuyRepository: PhotoBuyRepository,
    @Inject() private readonly photoService: PhotoService,
    private readonly prisma: PrismaService,
  ) {}

  //TODO: what if photographer update visibility to private => handle deactive sell
  //
  async sellPhoto(userId: string, sellPhotoDto: CreatePhotoSellingDto) {
    const photo =
      await this.photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        sellPhotoDto.photoId,
      );

    const previousActivePhotoSell =
      await this.photoSellRepository.getByActiveAndPhotoId(
        sellPhotoDto.photoId,
      );

    if (
      previousActivePhotoSell &&
      previousActivePhotoSell.description === sellPhotoDto.description
    ) {
      //idemponent
      return plainToInstance(PhotoSellDto, previousActivePhotoSell, {});
    }

    photo.watermark = true;
    photo.visibility = 'PUBLIC';

    const prismaQuery: PrismaPromise<any>[] = [];
    if (previousActivePhotoSell) {
      const updatePreviousPhotoSellQuery = this.photoSellRepository.updateQuery(
        previousActivePhotoSell.id,
        {
          active: false,
        },
      );
      prismaQuery.push(updatePreviousPhotoSellQuery);
    }

    const updatePhotoToPublicAndWatermarkQuery =
      this.photoRepository.updateQuery(photo);
    prismaQuery.push(updatePhotoToPublicAndWatermarkQuery);

    const photoSell = plainToInstance(PhotoSellEntity, sellPhotoDto);

    const createPhotoSellQuery =
      this.photoSellRepository.createAndActiveByPhotoIdQuery(photoSell);
    prismaQuery.push(createPhotoSellQuery);

    const [, newPhotoSell] = await this.prisma
      .extendedClient()
      .$transaction([...prismaQuery]);

    return plainToInstance(PhotoSellDto, newPhotoSell);
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

  async buyPhotoRequest(userId: string, buyPhotoRequest: BuyPhotoRequestDto) {
    const photoSell = await this.photoSellRepository.getByActiveAndPhotoId(
      buyPhotoRequest.photoId,
    );

    if (!photoSell) {
      throw new PhotoSellNotFoundException();
    }

    if (photoSell.photo.photographerId === userId) {
      throw new CannotBuyOwnedPhotoException();
    }

    const availableRes = await this.photoService.getAvailablePhotoResolution(
      buyPhotoRequest.photoId,
    );

    const indexOfChoosedRes = availableRes.indexOf(buyPhotoRequest.size);
    if (indexOfChoosedRes < 0) {
      throw new BuyQualityIsNotExistException();
    }

    const previousPhotoBuy = await this.photoBuyRepository.findFirst(
      photoSell.id,
      userId,
      buyPhotoRequest.size,
    );

    if (previousPhotoBuy) {
      throw new ExistPhotoBuyWithChoosedResolutionException();
    }

    //4 resolutions
    //2
    //[4k 2k 1080p 720p]
    //              x <-- index = 3 => +1 = 4 => price = base / 4
    const priceOfSelectedRes = photoSell.price.div(indexOfChoosedRes + 1);
    const fee = priceOfSelectedRes.mul(10).div(100);

    await this.sepayService.validateWalletBalanceIsEnough(
      userId,
      priceOfSelectedRes.toNumber(),
    );

    const newPhotoBuy = await this.photoBuyRepository.createWithTransaction(
      userId,
      photoSell.photo.photographerId,
      photoSell.id,
      fee,
      priceOfSelectedRes,
      buyPhotoRequest.size,
    );

    return plainToInstance(PhotoBuyResponseDto, newPhotoBuy);
  }
}
