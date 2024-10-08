import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PhotoStatus,
  PhotoVisibility,
  PrismaPromise,
  ShareStatus,
} from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { PresignedUploadUrlRequest } from '../dtos/rest/presigned-upload-url.request';
import {
  PresignedUploadUrlResponse,
  SignedUpload,
} from '../dtos/rest/presigned-upload-url.response.dto';
import { Utils } from 'src/infrastructure/utils/utils';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';
import { v4 } from 'uuid';
import { PhotoDto, SignedPhotoDto } from '../dtos/photo.dto';
import { Photo } from '../entities/photo.entity';
import { NotBelongPhotoException } from '../exceptions/not-belong-photo.exception';
import { PhotoIsPendingStateException } from '../exceptions/photo-is-pending-state.exception';
import { SignedUrl } from '../dtos/photo-signed-url.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Queue } from 'bullmq';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { ProcessPhotosRequest } from '../dtos/rest/process-images.request.dto';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotographerNotFoundException } from 'src/photographer/exceptions/photographer-not-found.exception';
import { RunOutPhotoQuotaException } from '../exceptions/run-out-photo-quota.exception';
import { DatabaseService } from 'src/database/database.service';
import { PhotoProcessService } from './photo-process.service';
import { SharePhotoRequestDto } from '../dtos/rest/share-photo.request.dto';
import { ShareStatusIsNotReadyException } from '../exceptions/share-status-is-not-ready.exception';
import { ChoosedShareQualityIsNotFoundException } from '../exceptions/choosed-share-quality-is-not-found.exception';
import { SharePhotoResponseDto } from '../dtos/rest/share-photo-response.dto';
import { EmptyOriginalPhotoException } from '../exceptions/empty-original-photo.exception';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { PhotoSharingRepository } from 'src/database/repositories/photo-sharing.repository';
import { CreatePhotoSharingFailedException } from '../exceptions/create-photo-sharing-failed.exception';
import { SignedPhotoSharingDto } from '../dtos/signed-photo-sharing.dto';
import { plainToInstance } from 'class-transformer';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ShareQualityAlreadyExistException } from '../exceptions/share-quality-already-exist.exception';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoSellDto } from '../dtos/photo-sell.dto';

import { PhotoSellEntity } from '../entities/photo-sell.entity';
import { PrismaService } from 'src/prisma.service';
import { CannotBuyOwnedPhotoException } from '../exceptions/cannot-buy-owned-photo.exception';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { PhotoSellNotFoundException } from '../exceptions/photo-sell-not-found.exception';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { SepayService } from 'src/payment/services/sepay.service';
import { NotEnoughBalanceException } from 'src/user/exceptions/not-enought-balance.exception';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { BuyQualityIsNotExistException } from '../exceptions/buy-quality-is-not-exist.exception';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { ExistPhotoBuyWithChoosedResolutionException } from '../exceptions/exist-photo-buy-with-choosed-resolution.exception';
import { UnrecognizedAdobeSidecarException } from '../exceptions/unrecognized-adobe-sidecar.exception';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject() private readonly databaseService: DatabaseService,
    @Inject() private readonly sepayService: SepayService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly photoSharingRepository: PhotoSharingRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoSellRepository: PhotoSellRepository,
    @Inject() private readonly photoBuyRepository: PhotoBuyRepository,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
    @InjectQueue(PhotoConstant.PHOTO_WATERMARK_QUEUE)
    private readonly photoWatermarkQueue: Queue,
    @InjectQueue(PhotoConstant.PHOTO_SHARE_QUEUE)
    private readonly photoShareQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
    userId: string,
    id: string,
  ) {
    const photo = await this.photoRepository.getPhotoById(id);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (photo.photographerId !== userId) {
      throw new NotBelongPhotoException();
    }

    return photo;
  }

  async getSharedPhotoById(
    sharedPhotoId: string,
  ): Promise<SignedPhotoSharingDto> {
    const sharedPhoto =
      await this.photoSharingRepository.findUniqueById(sharedPhotoId);

    if (!sharedPhoto) {
      throw new PhotoNotFoundException();
    }

    const signedSharePhotoUrl =
      await this.photoProcessService.getSignedObjectUrl(
        sharedPhoto.sharePhotoUrl,
      );

    sharedPhoto.sharePhotoUrl = signedSharePhotoUrl;

    //using class transformer to exclude what doesnt want to show
    return plainToInstance(SignedPhotoSharingDto, sharedPhoto, {});
  }

  async findAllShared(userId: string, photoId: string) {
    await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
      userId,
      photoId,
    );

    const sharedPhotos =
      await this.photoSharingRepository.findAllByOriginalPhotoId(photoId);

    return sharedPhotos.map(
      (s) =>
        new SharePhotoResponseDto(
          s.watermark,
          s.quality,
          `${process.env.FRONTEND_ORIGIN}/shared-photo/${s.id}`,
        ),
    );
  }

  async sharePhoto(userId: string, shareRequest: SharePhotoRequestDto) {
    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        shareRequest.photoId,
      );

    if (photo.shareStatus !== ShareStatus.READY) {
      throw new ShareStatusIsNotReadyException();
    }

    const choosedQualityPhotoUrl = photo.sharePayload[shareRequest.resolution];

    if (!choosedQualityPhotoUrl) {
      throw new ChoosedShareQualityIsNotFoundException();
    }
    try {
      const photoSharing = await this.photoSharingRepository.create(
        photo.id,
        false,
        shareRequest.resolution,
        choosedQualityPhotoUrl,
      );

      if (!photoSharing) {
        throw new CreatePhotoSharingFailedException();
      }

      return new SharePhotoResponseDto(
        false,
        shareRequest.resolution,
        `${process.env.FRONTEND_ORIGIN}/shared-photo/${photoSharing.id}`,
      );
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ShareQualityAlreadyExistException();
        }
      }
    }
  }

  async getAvailablePhotoResolution(userId: string, id: string) {
    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        id,
      );

    if (photo.status === 'PENDING') {
      throw new PhotoIsPendingStateException();
    }

    if (photo.shareStatus === 'NOT_READY') {
      await this.photoShareQueue.add(PhotoConstant.GENERATE_SHARE_JOB_NAME, {
        userId,
        photoId: photo.id,
        debounce: {
          id: photo.id,
          ttl: 10000,
        },
      });

      return true;
    }

    return this.photoProcessService.getAvailableResolution(
      photo.originalPhotoUrl,
    );
  }

  async sendWatermarkRequest(
    userId: string,
    generateWatermarkRequest: GenerateWatermarkRequestDto,
  ) {
    const photo = await this.photoRepository.getPhotoById(
      generateWatermarkRequest.photoId,
    );

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (photo.photographerId != userId) {
      throw new NotBelongPhotoException();
    }

    await this.photoWatermarkQueue.add(
      PhotoConstant.GENERATE_WATERMARK_JOB,
      {
        userId,
        generateWatermarkRequest,
      },
      {
        debounce: {
          id: photo.id,
          ttl: 10000,
        },
      },
    );
  }

  async sendProcessImageToMq(
    userId: string,
    processPhotosRequest: ProcessPhotosRequest,
  ) {
    await this.photoProcessQueue.add(
      PhotoConstant.PROCESS_PHOTO_JOB_NAME,
      {
        userId,
        processPhotosRequest,
      },
      {
        debounce: {
          id: processPhotosRequest.signedUpload.photoId,
          ttl: 10000,
        },
      },
    );

    await this.photoShareQueue.add(PhotoConstant.GENERATE_SHARE_JOB_NAME, {
      userId,
      photoId: processPhotosRequest.signedUpload.photoId,
      debounce: {
        id: processPhotosRequest.signedUpload.photoId,
        ttl: 10000,
      },
    });

    const generateWatermarkRequest: GenerateWatermarkRequestDto = {
      photoId: processPhotosRequest.signedUpload.photoId,
      text: 'PUREPIXEL',
    };

    await this.photoWatermarkQueue.add(PhotoConstant.GENERATE_WATERMARK_JOB, {
      userId,
      generateWatermarkRequest,
      debounce: {
        id: processPhotosRequest.signedUpload.photoId,
        ttl: 10000,
      },
    });
  }

  async signUrlFromPhotos(photo: Photo) {
    if (photo.status == 'PENDING') {
      throw new PhotoIsPendingStateException();
    }

    const url = photo.watermark
      ? photo.watermarkPhotoUrl
      : photo.originalPhotoUrl;

    const thumbnail = photo.watermark
      ? photo.watermarkThumbnailPhotoUrl
      : photo.thumbnailPhotoUrl;

    if (url.length == 0 || thumbnail.length == 0) {
      console.log(`error photo without thumbnail or original: ${photo.id}`);
      throw new EmptyOriginalPhotoException();
    }
    const signedUrl = await this.photoProcessService.getSignedObjectUrl(url);
    const signedThumbnail =
      await this.photoProcessService.getSignedObjectUrl(thumbnail);

    return new SignedUrl(signedUrl, signedThumbnail);
  }

  async updatePhotos(
    userId: string,
    photoDtos: PhotoDto[],
  ): Promise<PhotoDto[]> {
    const photoPromises = photoDtos.map(async (dto) => {
      const photo =
        await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
          userId,
          dto.id,
        );

      if (photo.photographerId !== userId) {
        throw new NotBelongPhotoException();
      }

      if (dto.exif) {
        const removedNullByteExifsString = JSON.stringify(dto.exif).replaceAll(
          '\\u0000',
          '',
        );
        photo.exif = JSON.parse(removedNullByteExifsString);
      }

      photo.categoryId = dto.categoryId;
      photo.title = dto.title;
      photo.watermark = dto.watermark;
      photo.showExif = dto.showExif;
      photo.colorGrading = dto.colorGrading;
      photo.location = dto.location;
      photo.captureTime = dto.captureTime;
      photo.description = dto.description;
      photo.photoTags = dto.photoTags;

      if (dto.photoType === 'RAW') {
        photo.photoType = 'RAW';
      } else if (dto.photoType === 'EDITED') {
        photo.photoType = 'EDITED';
      }

      if (dto.visibility === 'PRIVATE') {
        photo.visibility = 'PRIVATE';
      } else if (dto.visibility === 'PUBLIC') {
        photo.visibility = 'PUBLIC';
      } else {
        photo.visibility = 'SHARE_LINK';
      }

      return photo;
    });

    const photos = await Promise.all(photoPromises);

    const updateQueries = this.photoRepository.batchUpdate(photos);
    const updateResults =
      await this.databaseService.applyTransactionMultipleQueries(updateQueries);

    return updateResults.map((p) => p as PhotoDto);
  }

  async findPublicPhotos(filter: FindAllPhotoFilterDto) {
    filter.visibility = PhotoVisibility.PUBLIC;
    filter.status = PhotoStatus.PARSED;

    return await this.findAll(filter);
  }

  async findAllWithUpvoteAndCommentCountByUserId(userId: string) {
    return this.photoRepository.findAllPhotosWithVoteAndCommentCountByUserId(
      userId,
    );
  }

  async findAll(filter: FindAllPhotoFilterDto) {
    this.logger.log({
      filter,
    });

    const count = await this.photoRepository.count(filter);

    const photos = await this.photoRepository.findAll(
      filter,
      filter.toSkip(),
      filter.limit,
    );

    const signedPhotoDtoPromises = photos.map(async (p) => {
      const signedPhotoDto = plainToInstance(SignedPhotoDto, p);

      const signedUrls = await this.signUrlFromPhotos(p);

      signedPhotoDto.signedUrl = signedUrls;

      return signedPhotoDto;
    });

    const signedPhotos = await Promise.all(signedPhotoDtoPromises);

    return new PagingPaginatedResposneDto<PhotoDto>(
      filter.limit,
      count,
      signedPhotos,
    );
  }

  async deleteById(userId: string, photoId: string) {
    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        photoId,
      );

    await this.photoRepository.delete(photo.id);

    return true;
  }

  async getSignedPhotoById(userId: string, id: string) {
    const photo = await this.photoRepository.getPhotoDetailById(id);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (
      photo.visibility === PhotoVisibility.PRIVATE &&
      photo.photographerId !== userId
    ) {
      throw new PhotoIsPrivatedException();
    }

    const signedPhotoDto = plainToInstance(SignedPhotoDto, photo);

    const signedUrls = await this.signUrlFromPhotos(photo);
    signedPhotoDto.signedUrl = signedUrls;

    return signedPhotoDto;
  }

  async getPresignedUploadUrl(
    userId: string,
    presignedUploadUrlRequest: PresignedUploadUrlRequest,
  ): Promise<PresignedUploadUrlResponse> {
    const user = await this.userRepository.findUserQuotaById(userId);

    if (!user) {
      throw new PhotographerNotFoundException();
    }

    if (user.photoQuotaUsage >= user.maxPhotoQuota) {
      throw new RunOutPhotoQuotaException();
    }

    const extension = Utils.regexFileExtension.exec(
      presignedUploadUrlRequest.filename,
    )[1];

    if (
      extension !== 'jpg' &&
      extension !== 'jpeg' &&
      extension !== 'png' &&
      extension !== 'bmp' &&
      extension !== 'bitmap'
    ) {
      throw new FileIsNotValidException();
    }

    const storageObjectKey = `${userId}/${v4()}.${extension}`;

    const presignedUploadUrl =
      await this.photoProcessService.getPresignUploadUrl(storageObjectKey);

    const photo = await this.photoRepository.createTemporaryPhotos(
      userId,
      storageObjectKey,
    );

    const signedUpload = new SignedUpload(
      presignedUploadUrlRequest.filename,
      presignedUploadUrl,
      storageObjectKey,
      photo.id,
    );

    return new PresignedUploadUrlResponse(signedUpload);
  }

  async parseAndValidateLightroomPresentFromBuffer(file: Express.Multer.File) {
    const sidecar = await this.photoProcessService.parseXmpFromBuffer(
      file.buffer,
    );

    const creatorTool: string = sidecar.CreatorTool;

    if (
      creatorTool.indexOf('Photoshop') < 0 &&
      creatorTool.indexOf('Lightroom') < 0
    ) {
      throw new UnrecognizedAdobeSidecarException();
    }
  }

  //TODO: what if photographer update visibility to private => handle deactive sell
  //
  async sellPhoto(
    userId: string,
    sellPhotoDto: CreatePhotoSellingDto,
    afterPhotoFile: Express.Multer.File,
  ) {
    await this.parseAndValidateLightroomPresentFromBuffer(afterPhotoFile);

    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        sellPhotoDto.photoId,
      );

    if (photo.status !== 'PARSED') {
      throw new PhotoIsPendingStateException();
    }

    if (photo.shareStatus === 'NOT_READY') {
      throw new ShareStatusIsNotReadyException();
    }

    const previousActivePhotoSell =
      await this.photoSellRepository.getByActiveAndPhotoId(
        sellPhotoDto.photoId,
      );

    if (
      previousActivePhotoSell &&
      previousActivePhotoSell.price.toNumber() === sellPhotoDto.price &&
      previousActivePhotoSell.description === sellPhotoDto.description &&
      previousActivePhotoSell.afterPhotoUrl === sellPhotoDto.afterPhotoUrl
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
    const photoSell =
      await this.photoSellRepository.getByActiveAndPhotoId(photoId);

    if (!photoSell) {
      throw new PhotoSellNotFoundException();
    }

    if (photoSell.photo.photographerId === userId) {
      throw new CannotBuyOwnedPhotoException();
    }

    const previousPhotoBuys = await this.photoBuyRepository.findAll(
      photoSell.id,
      userId,
    );

    const mappingToDtoPromises = previousPhotoBuys.map(async (photobuy) => {
      const signedPhotoBuyDto = plainToInstance(SignedPhotoBuyDto, photobuy);

      //signing resolution url if transaction is paid
      if (
        photobuy.userToUserTransaction.fromUserTransaction.status === 'SUCCESS'
      ) {
        signedPhotoBuyDto.signedPhotoUrl =
          await this.photoProcessService.getSignedObjectUrl(
            photobuy.resolutionUrl,
          );
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

    const selectedResolutionUrl =
      photoSell.photo.sharePayload[buyPhotoRequest.resolution];

    if (!selectedResolutionUrl) {
      throw new BuyQualityIsNotExistException();
    }

    const previousPhotoBuy = await this.photoBuyRepository.findFirst(
      photoSell.id,
      userId,
      buyPhotoRequest.resolution,
    );

    if (previousPhotoBuy) {
      throw new ExistPhotoBuyWithChoosedResolutionException();
    }

    const userWallet = await this.sepayService.getWalletByUserId(userId);

    if (userWallet.walletBalance < photoSell.price.toNumber()) {
      throw new NotEnoughBalanceException();
    }

    const fee = photoSell.price.mul(5).div(100);

    const newPhotoBuy = await this.photoBuyRepository.createWithTransaction(
      userId,
      photoSell.photo.photographerId,
      photoSell.id,
      fee,
      photoSell.price,
      buyPhotoRequest.resolution,
      selectedResolutionUrl,
    );

    return plainToInstance(PhotoBuyResponseDto, newPhotoBuy);
  }
}
