import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  Photo,
  PhotoType,
  PhotoVisibility,
  Prisma,
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
import { NotificationConstant } from 'src/notification/constants/notification.constant';
import { BunnyService } from 'src/storage/services/bunny.service';
import { UploadPhotoFailedException } from '../exceptions/upload-photo-failed.exception';
import { ExifNotFoundException } from '../exceptions/exif-not-found.exception';
import { MissingMakeExifException } from '../exceptions/missing-make-exif.exception';
import { MissingModelExifException } from '../exceptions/missing-model-exif.exception';
import { SignedUrl } from '../dtos/photo-signed-url.dto';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { PhotoGenerateWatermarkService } from './photo-generate-watermark.service';
import { CameraConstant } from 'src/camera/constants/camera.constant';

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
    @Inject()
    private readonly photoGenerateWatermarkService: PhotoGenerateWatermarkService,
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
    @InjectQueue(CameraConstant.CAMERA_PROCESS_QUEUE)
    private readonly cameraQueue: Queue,
    private readonly prisma: PrismaService,
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,
  ) {}

  async sendImageWatermarkQueue(
    userId: string,
    photoId: string,
    generateWatermarkRequest: GenerateWatermarkRequestDto,
  ) {
    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    if (photo.photographerId !== userId) {
      throw new NotBelongPhotoException();
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

    const availableRes = await this.getAvailablePhotoResolution(photo.id);

    if (availableRes.indexOf(shareRequest.size) <= 0) {
      throw new ChoosedShareQualityIsNotFoundException();
    }

    const shareUrl = this.bunnyService.getPresignedFile(
      photo.originalPhotoUrl,
      `?width=${shareRequest.size}`,
    );

    return new SharePhotoResponseDto(shareRequest.size, shareUrl);
  }

  async getAvailablePhotoResolution(id: string) {
    // const cacheResolutionKey = `PHOTO_RESOLUTION:${id}`;
    //
    // const cachedResolution =
    //   await this.cacheManager.get<string[]>(cacheResolutionKey);
    //
    // if (cachedResolution) {
    //   return cachedResolution;
    // }

    const photo = await this.photoRepository.findUniqueOrThrow(id);

    const availableRes = [];

    for (
      let i = photo.width;
      i >= PhotoConstant.MIN_PHOTO_WIDTH;
      i -= Math.floor((i * 20) / 100)
    ) {
      availableRes.push(i);
    }

    // this.cacheManager.set(cacheResolutionKey, availableRes);

    return availableRes;
  }

  async signPhoto(photo: Photo): Promise<SignedPhotoDto> {
    const signedPhotoDto = plainToInstance(SignedPhotoDto, photo);

    const url = photo.watermark
      ? photo.watermarkPhotoUrl
      : photo.originalPhotoUrl;

    const thumbnail = `${
      photo.watermark ? photo.watermarkPhotoUrl : photo.originalPhotoUrl
    }`;

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
      thumbnail,
      `?width=${PhotoConstant.THUMBNAIL_WIDTH}`,
    );

    const signedUrlDto = new SignedUrl(signedUrl, signedThumbnailUrl);
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

    prismaPromises.push(
      this.photoRepository.updateByIdQuery(id, {
        categories: {
          connect: photoUpdateDto.categoryIds.map((id) => ({ id })),
        },
        title: photoUpdateDto.title,
        watermark: photoUpdateDto.watermark,
        description: photoUpdateDto.description,
        photoType: photoUpdateDto.photoType,
        visibility: photoUpdateDto.visibility,
        exif,
      }),
    );

    await this.prisma.extendedClient().$transaction(prismaPromises);

    return await this.getSignedPhotoById(userId, id);
  }

  async findPublicPhotos(filter: FindAllPhotoFilterDto) {
    filter.visibility = 'PUBLIC';
    filter.status = 'PARSED';
    filter.photoType = 'RAW'; //ensure only get RAW photo

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

    count = await this.photoRepository.count(filter);

    let photos = await this.photoRepository.findAll(
      filter.toWhere(),
      filter.toOrderBy(),
      filter.toSkip(),
      filter.limit,
    );

    const signedPhotoDtoPromises = photos.map(async (p) => {
      const signedPhotoDto = await this.signPhoto(p);
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
    const photo = await this.photoRepository.findUniqueOrThrow(id);

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
        description: '',
        title: photoUploadDto.file.originalName,
        size: photoUploadDto.file.size,
        exif,
        width: metadata.width,
        height: metadata.height,
        status: 'PARSED',
        photoType: photoType,
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
      console.log(e);

      if (e instanceof HttpException) {
        throw e;
      }

      throw new UploadPhotoFailedException();
    }
  }
}
