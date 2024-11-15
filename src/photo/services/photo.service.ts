import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  Photo,
  PhotoType,
  PhotoVisibility,
  PrismaPromise,
} from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { PhotoUploadRequestDto } from '../dtos/rest/photo-upload.request';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';
import { NotBelongPhotoException } from '../exceptions/not-belong-photo.exception';
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
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';

import { PrismaService } from 'src/prisma.service';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { DuplicatedTagFoundException } from '../exceptions/duplicated-tag-found.exception';
import { CategoryRepository } from 'src/database/repositories/category.repository';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';
import { BunnyService } from 'src/storage/services/bunny.service';
import { UploadPhotoFailedException } from '../exceptions/upload-photo-failed.exception';
import { ExifNotFoundException } from '../exceptions/exif-not-found.exception';
import { MissingMakeExifException } from '../exceptions/missing-make-exif.exception';
import { MissingModelExifException } from '../exceptions/missing-model-exif.exception';
import { SignedUrl } from '../dtos/photo-signed-url.dto';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { PhotoGenerateWatermarkService } from './photo-generate-watermark.service';
import { CameraConstant } from 'src/camera/constants/camera.constant';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { PhotoValidateService } from './photo-validate.service';
import { PhotoSizeDto } from '../dtos/photo-size.dto';
import { PhotoDetail } from 'src/database/types/photo';
import { CannotUpdateWatermarkPhotoHasActiveSellingException } from '../exceptions/cannot-update-watermark-photo-has-active-selling.exception';
import { CannotUpdateVisibilityPhotoHasActiveSellingException } from '../exceptions/cannot-update-visibility-photo-has-active-selling.exception';
import { Utils } from 'src/infrastructure/utils/utils';
import { FindNextPhotoFilterDto } from '../dtos/find-next.filter.dto';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly photoSellRepository: PhotoSellRepository,
    @Inject() private readonly photoTagRepository: PhotoTagRepository,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject() private readonly photoValidateService: PhotoValidateService,
    @Inject()
    private readonly photoGenerateWatermarkService: PhotoGenerateWatermarkService,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
    @InjectQueue(CameraConstant.CAMERA_PROCESS_QUEUE)
    private readonly cameraQueue: Queue,
    @InjectQueue(PhotoConstant.PHOTO_VIEWCOUNT_QUEUE)
    private readonly photoViewCountQueue: Queue,
    private readonly prisma: PrismaService,
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,
  ) {}

  async sendImageWatermarkQueue(
    userId: string,
    photoId: string,
    generateWatermarkRequest: GenerateWatermarkRequestDto,
  ) {
    const photo =
      await this.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
        userId,
        photoId,
      );

    if (photo.status === 'DUPLICATED') {
      throw new FailToPerformOnDuplicatedPhotoException();
    }

    const updatedPhoto =
      await this.photoGenerateWatermarkService.generateWatermark(
        photo.id,
        generateWatermarkRequest,
      );

    return this.signPhoto(updatedPhoto);
  }

  async findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
    userId: string,
    id: string,
  ) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

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

    if (photo.status === 'DUPLICATED') {
      throw new FailToPerformOnDuplicatedPhotoException();
    }

    const availableRes = await this.getAvailablePhotoResolution(photo.id);

    if (
      availableRes.findIndex(
        (r) =>
          r.width === shareRequest.size.width &&
          r.height === shareRequest.size.height,
      ) < 0
    ) {
      throw new ChoosedShareQualityIsNotFoundException();
    }

    const shareUrl = this.bunnyService.getPresignedFile(
      photo.originalPhotoUrl,
      `?width=${shareRequest.size.width}`,
    );

    return new SharePhotoResponseDto(shareRequest.size, shareUrl);
  }

  async getAvailablePhotoResolution(id: string) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    const availableRes: PhotoSizeDto[] = [];

    let height = photo.height;

    for (
      let i = photo.width;
      i >= PhotoConstant.MIN_PHOTO_WIDTH;
      i -= Math.floor((i * 20) / 100)
    ) {
      const previewUrl = this.bunnyService.getPresignedFile(
        photo.watermark ? photo.watermarkPhotoUrl : photo.originalPhotoUrl,
        `?width=${i}`,
      );
      availableRes.push(new PhotoSizeDto(i, height, previewUrl));

      height -= Math.floor((height * 20) / 100);
    }

    return availableRes;
  }

  async signPhotos(photos: Photo[]) {
    const promises = photos.map(async (p) => this.signPhoto(p));

    return await Promise.all(promises);
  }

  async signPhotoDetail(photoDetail: PhotoDetail) {
    const signedPhotoDto = plainToInstance(SignedPhotoDto, photoDetail);

    const url = photoDetail.watermark
      ? photoDetail.watermarkPhotoUrl
      : photoDetail.originalPhotoUrl;

    const thumbnail = `${
      photoDetail.watermark
        ? photoDetail.watermarkPhotoUrl
        : photoDetail.originalPhotoUrl
    }`;

    if (url.length == 0) {
      console.log(
        `error photo without thumbnail or original: ${photoDetail.id}`,
      );

      if (photoDetail.watermark) {
        await this.sendImageWatermarkQueue(
          photoDetail.photographerId,
          photoDetail.id,
          {
            text: 'PXL',
          },
        );
      } else {
        throw new EmptyOriginalPhotoException();
      }
    }

    const signedUrl = this.bunnyService.getPresignedFile(url);

    const signedThumbnailUrl = this.bunnyService.getPresignedFile(
      `thumbnail/${photoDetail.id}.jpg`,
    );
    const signedPlaceholderUrl = this.bunnyService.getPresignedFile(
      `placeholder/${photoDetail.id}.jpg`,
    );

    const signedUrlDto = new SignedUrl(signedUrl, signedThumbnailUrl);
    signedUrlDto.placeholder = signedPlaceholderUrl;
    signedPhotoDto.signedUrl = signedUrlDto;

    signedPhotoDto.photoSellings?.forEach((photoSelling) => {
      photoSelling.pricetags.forEach((pricetag) => {
        pricetag.preview = this.bunnyService.getPresignedFile(
          photoDetail.watermarkPhotoUrl,
          `?width=${pricetag.width}`,
        );
      });
    });

    return signedPhotoDto;
  }

  async signPhoto(photo: Photo): Promise<SignedPhotoDto> {
    const signedPhotoDto = plainToInstance(SignedPhotoDto, photo);

    const url = photo.watermark
      ? photo.watermarkPhotoUrl
      : photo.originalPhotoUrl;

    if (url.length == 0) {
      console.log(`error photo without thumbnail or original: ${photo.id}`);

      if (photo.watermark) {
        await this.sendImageWatermarkQueue(photo.photographerId, photo.id, {
          text: 'PXL',
        });
      } else {
        throw new EmptyOriginalPhotoException();
      }
    }

    const signedUrl = this.bunnyService.getPresignedFile(url);
    const signedThumbnailUrl = this.bunnyService.getPresignedFile(
      `thumbnail/${photo.id}.jpg`,
    );
    const signedPlaceholderUrl = this.bunnyService.getPresignedFile(
      `placeholder/${photo.id}.jpg`,
    );

    const signedUrlDto = new SignedUrl(signedUrl, signedThumbnailUrl);
    signedUrlDto.placeholder = signedPlaceholderUrl;

    signedPhotoDto.signedUrl = signedUrlDto;

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

    if (photo.status === 'DUPLICATED') {
      throw new FailToPerformOnDuplicatedPhotoException();
    }

    const exif = photo.exif;

    const prismaPromises: PrismaPromise<any>[] = [];

    if (photo.photographerId !== userId) {
      throw new NotBelongPhotoException();
    }

    if (photoUpdateDto.categoryIds) {
      const categories = await this.categoryRepository.findMany({
        id: {
          in: photoUpdateDto.categoryIds,
        },
      });

      if (categories.length !== photoUpdateDto.categoryIds.length) {
        throw new CategoryNotFoundException();
      }
    }

    //TODO: update exif to photo using queue
    if (photoUpdateDto.gps) {
      exif['latitude'] = photoUpdateDto.gps.latitude;
      exif['longitude'] = photoUpdateDto.gps.longitude;
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

    //prevent empty value
    if (!photoUpdateDto.categoryIds) {
      photoUpdateDto.categoryIds = [];
    }

    const activePhotoSellings = photo.photoSellings.find(
      (s) => s.active === true,
    );

    if (photoUpdateDto.watermark && activePhotoSellings) {
      throw new CannotUpdateWatermarkPhotoHasActiveSellingException();
    }

    if (photoUpdateDto.visibility && activePhotoSellings) {
      throw new CannotUpdateVisibilityPhotoHasActiveSellingException();
    }

    const normalizedTitle = photoUpdateDto.title
      ? Utils.normalizeText(photoUpdateDto.title)
      : Utils.normalizeText(photo.title);

    prismaPromises.push(
      this.photoRepository.updateByIdQuery(id, {
        categories: {
          connect: photoUpdateDto.categoryIds.map((id) => ({ id })),
        },
        title: photoUpdateDto.title,
        normalizedTitle,
        watermark: photoUpdateDto.watermark,
        description: photoUpdateDto.description,
        photoType: photoUpdateDto.photoType,
        visibility: photoUpdateDto.visibility,
        exif,
      }),
    );

    const prismaResults = await this.prisma
      .extendedClient()
      .$transaction(prismaPromises);

    const updatedPhoto = prismaResults[prismaResults.length - 1];

    return await this.signPhoto(updatedPhoto);
  }

  async findNextPublicPhotos(userId: string, filter: FindNextPhotoFilterDto) {
    const count = await this.photoRepository.count({
      visibility: 'PUBLIC',
      photoType: 'RAW',
    });

    const photos = await this.photoRepository.findAll(
      {
        visibility: 'PUBLIC',
        photoType: 'RAW',
      },
      [],
      1,
      filter.forward ? 1 : -1,
      filter.toCursor(),
    );

    const signedPhotos = await this.signPhotos(photos);

    return new PagingPaginatedResposneDto<SignedPhotoDto>(
      1,
      count,
      signedPhotos,
    );
  }

  async findPublicPhotos(userId: string, filter: FindAllPhotoFilterDto) {
    filter.photoType = 'RAW'; //ensure only get RAW photo
    filter.visibility = 'PUBLIC';

    return await this.findAll(userId, filter);
  }

  async findAllWithUpvoteAndCommentCountByUserId(userId: string) {
    return this.photoRepository.findAllPhotosWithVoteAndCommentCountByUserId(
      userId,
    );
  }

  async findAll(userId: string, filter: FindAllPhotoFilterDto) {
    let idFilterByGPS = [];
    let count = 0;

    if (
      filter.gps &&
      filter.latitude !== undefined &&
      filter.longitude !== undefined &&
      filter.distance !== undefined
    ) {
      const countByGPS = await this.photoRepository.countByGPS(
        filter.longitude,
        filter.latitude,
        filter.distance,
      );

      count = countByGPS[0]['count'];

      const idWithDistances = await this.photoRepository.findAllIdsByGPS(
        filter.longitude,
        filter.latitude,
        filter.distance,
      );

      idFilterByGPS = idWithDistances.map((iwd) => iwd['id']);
    }

    if (idFilterByGPS.length > 0) {
      filter.ids = idFilterByGPS;
    }

    const filterWhere = filter.toWhere(userId);

    this.logger.log(filterWhere);

    count = await this.photoRepository.count(filterWhere);

    const photos = await this.photoRepository.findAll(
      filterWhere,
      filter.toOrderBy(),
      filter.toSkip(),
      filter.limit,
    );

    let sortedPhotos = photos;

    if (idFilterByGPS.length > 0) {
      sortedPhotos = [];

      idFilterByGPS.forEach((id) => {
        const photo = photos.find((p) => p.id === id);
        if (!photo) {
          return;
        }

        sortedPhotos.push(photo);
      });
    }

    const signedPhotos = await this.signPhotos(sortedPhotos);

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

    await this.photoProcessQueue.add(PhotoConstant.DELETE_PHOTO_JOB_NAME, {
      originalPhotoUrl: photo.originalPhotoUrl,
    });

    const deleteQuery = this.photoRepository.deleteById(photo.id);

    const deactivePhotoSellQuery =
      this.photoSellRepository.deactivatePhotoSellByPhotoIdQuery(photoId);

    await this.prisma
      .extendedClient()
      .$transaction([deleteQuery, deactivePhotoSellQuery]);

    return true;
  }

  async findById(
    userId: string,
    id: string,
    validateOwnership: boolean = true,
  ) {
    const photo = await this.photoRepository.findUniqueOrThrow(id, userId);

    await this.photoViewCountQueue.add(PhotoConstant.INCREASE_VIEW_COUNT_JOB, {
      id: photo.id,
    });

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

    return await this.signPhotoDetail(photo);
  }

  async uploadPhoto(
    userId: string,
    photoType: PhotoType,
    photoUploadDto: PhotoUploadRequestDto,
  ): Promise<SignedPhotoDto> {
    const user = await this.userRepository.findUniqueOrThrow(userId);

    const sizeAsBigint = BigInt(photoUploadDto.file.size);
    const newUsageQuota = user.photoQuotaUsage + sizeAsBigint;

    if (newUsageQuota >= user.maxPhotoQuota) {
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

      const blurHash: string = await this.photoProcessService.bufferToBlurhash(
        photoUploadDto.file.buffer,
      );

      // await this.photoValidateService.validateHashAndMatching(
      //   photoUploadDto.file.buffer,
      //   photoUploadDto.file.originalName,
      // );

      exif['Copyright'] = ` © copyright by ${user.name}`;

      const storageObjectKey = await this.bunnyService.upload(
        photoUploadDto.file,
      );

      const normalizedTitle = Utils.normalizeText(
        photoUploadDto.file.originalName,
      );

      const photo = await this.photoRepository.create({
        photographer: {
          connect: {
            id: userId,
          },
        },
        description: '',
        title: photoUploadDto.file.originalName,
        normalizedTitle,
        size: photoUploadDto.file.size,
        exif,
        width: metadata.width,
        height: metadata.height,
        status: 'PARSED',
        photoType: photoType,
        blurHash,
        watermark: false,
        visibility: 'PRIVATE',
        originalPhotoUrl: storageObjectKey,
        watermarkPhotoUrl: '',
      });

      await this.photoProcessQueue.add(PhotoConstant.PROCESS_PHOTO_JOB_NAME, {
        id: photo.id,
      });

      await this.cameraQueue.add(CameraConstant.ADD_NEW_CAMERA_USAGE_JOB, {
        photoId: photo.id,
      });

      return this.signPhoto(photo);
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      console.log(e);

      throw new UploadPhotoFailedException();
    }
  }
}
