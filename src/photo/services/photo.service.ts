import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Photo,
  PhotoSell,
  PhotoVisibility,
  PrismaPromise,
} from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { PhotoUploadRequestDto } from '../dtos/rest/photo-upload.request';
import { Utils } from 'src/infrastructure/utils/utils';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';
import { v4 } from 'uuid';
import { NotBelongPhotoException } from '../exceptions/not-belong-photo.exception';
import { PhotoIsPendingStateException } from '../exceptions/photo-is-pending-state.exception';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { PhotoConstant } from '../constants/photo.constant';
import { Queue } from 'bullmq';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { UserRepository } from 'src/database/repositories/user.repository';
import { RunOutPhotoQuotaException } from '../exceptions/run-out-photo-quota.exception';
import { PhotoProcessService } from './photo-process.service';
import { SharePhotoRequestDto } from '../dtos/rest/share-photo.request.dto';
import { ChoosedShareQualityIsNotFoundException } from '../exceptions/choosed-share-quality-is-not-found.exception';
import { SharePhotoResponseDto } from '../dtos/rest/share-photo-response.dto';
import { EmptyOriginalPhotoException } from '../exceptions/empty-original-photo.exception';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { plainToInstance } from 'class-transformer';
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
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { BuyQualityIsNotExistException } from '../exceptions/buy-quality-is-not-exist.exception';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { ExistPhotoBuyWithChoosedResolutionException } from '../exceptions/exist-photo-buy-with-choosed-resolution.exception';
import { UnrecognizedAdobeSidecarException } from '../exceptions/unrecognized-adobe-sidecar.exception';
import { PhotoMinSizeIsNotExcessException } from '../exceptions/photo-min-size-is-not-excess.exception';
import { PhotoBuyNotFoundException } from '../exceptions/photo-buy-not-found.exception';
import { PhotoBuyTransactionIsNotSuccessException } from '../exceptions/photo-buy-transaction-is-not-success.exception';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { DuplicatedTagFoundException } from '../exceptions/duplicated-tag-found.exception';
import { CategoryRepository } from 'src/database/repositories/category.repository';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';
import { PhotoVoteRequestDto } from '../dtos/rest/photo-vote.request.dto';
import { PhotoVoteRepository } from 'src/database/repositories/photo-vote.repository';
import { PhotoVoteDto } from '../dtos/photo-vote.dto';
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { NotificationCreateDto } from 'src/notification/dtos/rest/notification-create.dto';
import { BunnyService } from 'src/storage/services/bunny.service';
import { UploadPhotoFailedException } from '../exceptions/upload-photo-failed.exception';
import { ExifNotFoundException } from '../exceptions/exif-not-found.exception';
import { MissingMakeExifException } from '../exceptions/missing-make-exif.exception';
import { MissingModelExifException } from '../exceptions/missing-model-exif.exception';
import { SignedUrl } from '../dtos/photo-signed-url.dto';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject() private readonly sepayService: SepayService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoSellRepository: PhotoSellRepository,
    @Inject() private readonly photoTagRepository: PhotoTagRepository,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly photoBuyRepository: PhotoBuyRepository,
    @Inject() private readonly photoVoteRepository: PhotoVoteRepository,
    @Inject() private readonly bunnyService: BunnyService,
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
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

  async sharePhoto(userId: string, shareRequest: SharePhotoRequestDto) {
    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        shareRequest.photoId,
      );

    const availableRes = await this.getAvailablePhotoResolution(photo.id);

    if (availableRes.indexOf(shareRequest.resolution) <= 0) {
      throw new ChoosedShareQualityIsNotFoundException();
    }

    const shareUrl = this.bunnyService.getPresignedFile(
      photo.originalPhotoUrl,
      `?width=${PhotoConstant.PHOTO_RESOLUTION_BIMAP.getValue(shareRequest.resolution)}`,
    );

    return new SharePhotoResponseDto(shareRequest.resolution, shareUrl);
  }

  async getAvailablePhotoResolution(id: string) {
    const cacheResolutionKey = `PHOTO_RESOLUTION:${id}`;

    const cachedResolution =
      await this.cacheManager.get<string[]>(cacheResolutionKey);

    if (cachedResolution) {
      return cachedResolution;
    }

    const photo = await this.photoRepository.getPhotoById(id);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    const availableRes = [...PhotoConstant.SUPPORTED_PHOTO_RESOLUTION];

    for (let i = 0; i < PhotoConstant.SUPPORTED_PHOTO_RESOLUTION.length; i++) {
      const pixelOfRes = PhotoConstant.PHOTO_RESOLUTION_BIMAP.getValue(
        PhotoConstant.SUPPORTED_PHOTO_RESOLUTION[i],
      );

      if (photo.width >= pixelOfRes) {
        break;
      }

      availableRes.shift();
    }

    this.cacheManager.set(cacheResolutionKey, availableRes);

    return availableRes;
  }

  async vote(
    userId: string,
    photoId: string,
    photoVoteRequestDto: PhotoVoteRequestDto,
  ) {
    const photo = await this.photoRepository.getPhotoById(photoId);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    const vote = await this.photoVoteRepository.vote(
      userId,
      photoVoteRequestDto.isUpvote,
      photoId,
    );

    const notificationDto: NotificationCreateDto = {
      userId,
      title: 'Tương tác mới',
      content: `Ảnh ${photo.title} của bạn vừa nhận được một đánh giá!`,
      referenceId: photoId,
      referenceType: 'PHOTO',
      type: 'IN_APP',
    };
    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationDto,
    );

    return plainToInstance(PhotoVoteDto, vote);
  }

  async deleteVote(userId: string, photoId: string) {
    const photo = await this.photoRepository.getPhotoById(photoId);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    await this.photoVoteRepository.delete(userId, photoId);

    return 'deleted';
  }

  async signPhoto(
    photo: Photo,
    photoSell?: PhotoSell,
  ): Promise<SignedPhotoDto> {
    const signedPhotoDto = plainToInstance(SignedPhotoDto, photo);

    const url = photo.watermark
      ? photo.watermarkPhotoUrl
      : photo.originalPhotoUrl;

    const thumbnail = `${
      photo.watermark ? photo.watermarkPhotoUrl : photo.originalPhotoUrl
    }`;

    if (url.length == 0) {
      console.log(`error photo without thumbnail or original: ${photo.id}`);
      throw new EmptyOriginalPhotoException();
    }

    const signedUrl = this.bunnyService.getPresignedFile(url);
    const signedThumbnailUrl = this.bunnyService.getPresignedFile(
      thumbnail,
      `?width=${PhotoConstant.THUMBNAIL_WIDTH}`,
    );

    const signedUrlDto = new SignedUrl(signedUrl, signedThumbnailUrl);
    signedPhotoDto.signedUrl = signedUrlDto;

    if (photoSell) {
      const signedColorGradingWatermark = this.bunnyService.getPresignedFile(
        photoSell.colorGradingPhotoWatermarkUrl,
      );

      signedPhotoDto.signedUrl.colorGradingWatermark =
        signedColorGradingWatermark;
    }

    return signedPhotoDto;
  }

  async updatePhoto(
    userId: string,
    id: string,
    photoUpdateDto: PhotoUpdateRequestDto,
  ): Promise<SignedPhotoDto> {
    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        id,
      );

    const prismaPromises: PrismaPromise<any>[] = [];

    if (photo.photographerId !== userId) {
      throw new NotBelongPhotoException();
    }

    if (photoUpdateDto.categoryId) {
      const category = await this.categoryRepository.findById(
        photoUpdateDto.categoryId,
      );
      if (!category) {
        throw new CategoryNotFoundException();
      }
    }

    if (photoUpdateDto.photoTags) {
      const setOftags = new Set(photoUpdateDto.photoTags);

      if (photoUpdateDto.photoTags.length !== setOftags.size) {
        throw new DuplicatedTagFoundException();
      }

      prismaPromises.push(this.photoTagRepository.deleteByPhotoId(id));

      setOftags.forEach((tag) =>
        prismaPromises.push(this.photoTagRepository.create(id, tag)),
      );
    }

    prismaPromises.push(
      this.photoRepository.updateByIdQuery(id, {
        categoryId: photoUpdateDto.categoryId,
        title: photoUpdateDto.title,
        watermark: photoUpdateDto.watermark,
        description: photoUpdateDto.description,
        photoType: photoUpdateDto.photoType,
        visibility: photoUpdateDto.visibility,
      }),
    );

    await this.prisma.extendedClient().$transaction(prismaPromises);

    return await this.getSignedPhotoById(userId, id);
  }

  async findPublicPhotos(filter: FindAllPhotoFilterDto) {
    filter.visibility = 'PUBLIC';
    filter.status = 'PARSED';

    return await this.findAll(filter);
  }

  async findAllWithUpvoteAndCommentCountByUserId(userId: string) {
    return this.photoRepository.findAllPhotosWithVoteAndCommentCountByUserId(
      userId,
    );
  }

  async findAll(filter: FindAllPhotoFilterDto) {
    this.logger.log(`findall with filter:`);
    this.logger.log(JSON.stringify(filter));

    const count = await this.photoRepository.count(filter);

    const photos = await this.photoRepository.findAll(
      filter.toWhere(),
      filter.toOrderBy(),
      filter.toSkip(),
      filter.limit,
    );

    const signedPhotoDtoPromises = photos.map(async (p) => {
      const signedPhotoDto = await this.signPhoto(p, p.photoSellings[0]);
      return signedPhotoDto;
    });

    const signedPhotos = await Promise.all(signedPhotoDtoPromises);

    return new PagingPaginatedResposneDto<SignedPhotoDto>(
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

    const deleteQuery = this.photoRepository.deleteQuery(photo.id);

    const deactivePhotoSellQuery =
      this.photoSellRepository.deactivatePhotoSellByPhotoIdQuery(photoId);

    await this.prisma.$transaction([deleteQuery, deactivePhotoSellQuery]);

    return true;
  }

  async getSignedPhotoById(
    userId: string,
    id: string,
    validateOwnership: boolean = true,
  ) {
    const photo = await this.photoRepository.getPhotoDetailById(id);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (
      validateOwnership &&
      photo.visibility === PhotoVisibility.PRIVATE &&
      photo.photographerId !== userId
    ) {
      throw new PhotoIsPrivatedException();
    }

    const signedPhotoDto = await this.signPhoto(photo);

    return signedPhotoDto;
  }

  async uploadPhoto(
    userId: string,
    photoUploadDto: PhotoUploadRequestDto,
  ): Promise<SignedPhotoDto> {
    const user = await this.userRepository.findUniqueOrThrow(userId);

    const sizeAsBigint = BigInt(photoUploadDto.file.size);
    const newUsageQuota = user.photoQuotaUsage + sizeAsBigint;

    if (newUsageQuota >= user.maxPhotoQuota) {
      console.log(newUsageQuota, user.maxPhotoQuota);
      throw new RunOutPhotoQuotaException();
    }

    const extension = photoUploadDto.file.extension;

    if (
      extension !== 'jpg' &&
      extension !== 'jpeg' &&
      extension !== 'png' &&
      extension !== 'bmp' &&
      extension !== 'bitmap'
    ) {
      throw new FileIsNotValidException();
    }

    try {
      const exif = await this.photoProcessService.parseExifFromBuffer(
        photoUploadDto.file.buffer,
      );

      const metadata = await this.photoProcessService.parseMetadataFromBuffer(
        photoUploadDto.file.buffer,
      );

      if (!exif) {
        throw new ExifNotFoundException();
      }

      if (!exif['Make']) {
        throw new MissingMakeExifException();
      }

      if (!exif['Model']) {
        throw new MissingModelExifException();
      }

      exif['Copyright'] = ` © copyright by ${user.name}`;

      const storageObjectKey = await this.bunnyService.upload(
        photoUploadDto.file,
      );

      const photo = await this.photoRepository.create({
        photographer: {
          connect: {
            id: userId,
          },
        },
        category: {
          connectOrCreate: {
            where: {
              name: PhotoConstant.DEFAULT_CATEGORY.name,
            },
            create: PhotoConstant.DEFAULT_CATEGORY,
          },
        },
        description: '',
        title: photoUploadDto.file.originalName,
        size: photoUploadDto.file.size,
        exif,
        width: metadata.width,
        height: metadata.height,
        status: 'PARSED',
        photoType: 'RAW',
        watermark: false,
        visibility: 'PRIVATE',
        originalPhotoUrl: storageObjectKey,
        watermarkPhotoUrl: '',
      });

      await this.photoProcessQueue.add(PhotoConstant.PROCESS_PHOTO_JOB_NAME, {
        id: photo.id,
      });

      return this.signPhoto(photo);
    } catch (e) {
      console.log(e);
      throw new UploadPhotoFailedException();
    }
  }

  async parseAndValidateLightroomPresentFromBuffer(file: Express.Multer.File) {
    const sidecar = await this.photoProcessService.parseXmpFromBuffer(
      file.buffer,
    );

    if (!sidecar) {
      throw new UnrecognizedAdobeSidecarException();
    }

    const creatorTool: string = sidecar.CreatorTool;

    if (file.size < PhotoConstant.MIN_PHOTO_SIZE) {
      throw new PhotoMinSizeIsNotExcessException();
    }

    if (
      !creatorTool ||
      (creatorTool.indexOf('Photoshop') < 0 &&
        creatorTool.indexOf('Lightroom') < 0)
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

    const previousActivePhotoSell =
      await this.photoSellRepository.getByActiveAndPhotoId(
        sellPhotoDto.photoId,
      );

    if (
      previousActivePhotoSell &&
      previousActivePhotoSell.price.toNumber() === sellPhotoDto.price &&
      previousActivePhotoSell.description === sellPhotoDto.description
    ) {
      //idemponent
      return plainToInstance(PhotoSellDto, previousActivePhotoSell, {});
    }

    const extension = Utils.regexFileExtension.exec(
      afterPhotoFile.originalname,
    )[1];

    const newPhotoSellId = v4();

    const colorGradingPhotoUrl = `color_grading/${newPhotoSellId}/${photo.id}.${extension}`;
    await this.photoProcessService.uploadFromBuffer(
      colorGradingPhotoUrl,
      afterPhotoFile.buffer,
    );

    //upload colorGrading first because watermark will replace buffer

    const watermarkAfterPhotoBuffer =
      await this.photoProcessService.makeTextWatermark(
        afterPhotoFile.buffer,
        'PUREPIXEL',
      );

    const watermarkColorGradingPhotoUrl = `watermark_color_grading/${newPhotoSellId}/${photo.id}.${extension}`;
    await this.photoProcessService.uploadFromBuffer(
      watermarkColorGradingPhotoUrl,
      watermarkAfterPhotoBuffer,
    );

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
    photoSell.id = newPhotoSellId;
    photoSell.colorGradingPhotoUrl = colorGradingPhotoUrl;
    photoSell.colorGradingPhotoWatermarkUrl = watermarkColorGradingPhotoUrl;

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

    const availableRes = await this.getAvailablePhotoResolution(
      buyPhotoRequest.photoId,
    );

    const indexOfChoosedRes = availableRes.indexOf(buyPhotoRequest.resolution);
    if (indexOfChoosedRes < 0) {
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
      buyPhotoRequest.resolution,
    );

    return plainToInstance(PhotoBuyResponseDto, newPhotoBuy);
  }

  async getPhotoWithScaledResolutionFromPhotoBuyId(
    userId: string,
    photobuyId: string,
  ) {
    const photobuy = await this.photoBuyRepository.findFirstById(
      photobuyId,
      userId,
    );

    if (!photobuy) {
      throw new PhotoBuyNotFoundException();
    }

    if (
      photobuy.userToUserTransaction.fromUserTransaction.status !== 'SUCCESS'
    ) {
      throw new PhotoBuyTransactionIsNotSuccessException();
    }

    const resPixels = PhotoConstant.PHOTO_RESOLUTION_BIMAP.getValue(
      photobuy.resolution,
    );

    if (!resPixels) {
      throw new BuyQualityIsNotExistException();
    }

    const sharp = await this.photoProcessService.sharpInitFromObjectKey(
      photobuy.photoSell.colorGradingPhotoUrl,
    );

    const resizedBuffer = await this.photoProcessService.resizeWithMetadata(
      sharp,
      resPixels,
    );

    return resizedBuffer;
  }
}
