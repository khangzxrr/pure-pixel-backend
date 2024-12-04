import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Photo, PhotoVisibility, PrismaPromise } from '@prisma/client';
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
import { UserService } from 'src/user/services/user.service';
import { FileSystemPhotoUploadRequestDto } from '../dtos/rest/file-system-photo-upload.request';

import { PhotoNotInPendingStateException } from '../exceptions/photo-not-in-pending-state.exception';

import { DownloadTemporaryPhotoDto } from '../dtos/rest/download-temporary-photo.request.dto';
import { TemporaryPhotoDto } from '../dtos/temporary-photo.dto';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,

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
    private readonly prisma: PrismaService,
    @Inject()
    private readonly userService: UserService,
  ) {}

  async downloadTemporaryPhoto(
    id: string,
    downloadTemporaryPhotoDto: DownloadTemporaryPhotoDto,
  ): Promise<Buffer> {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    if (photo.status !== 'PENDING') {
      throw new PhotoNotInPendingStateException();
    }

    const sharp = await this.photoProcessService.sharpInitFromFilePath(
      photo.watermark ? photo.watermarkPhotoUrl : photo.originalPhotoUrl,
    );

    if (downloadTemporaryPhotoDto.width) {
      const resizedBuffer = await this.photoProcessService.resize(
        sharp,
        downloadTemporaryPhotoDto.width,
      );

      return resizedBuffer;
    }

    return sharp.toBuffer();
  }

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

    await this.photoGenerateWatermarkService.generateWatermark(
      photo.id,
      generateWatermarkRequest,
    );

    const updatedPhoto = await this.photoRepository.findUniqueOrThrow(photoId);

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

    let shareUrl = this.bunnyService.getPresignedFile(
      photo.originalPhotoUrl,
      `?width=${shareRequest.size.width}`,
    );

    if (photo.status === 'PENDING') {
      shareUrl = `${process.env.BACKEND_ORIGIN}/photo/${photo.id}/temporary-photo?width=${shareRequest.size.width}`;
    }

    return new SharePhotoResponseDto(shareRequest.size, shareUrl);
  }

  async getAvailablePhotoResolution(id: string) {
    const photo = await this.photoRepository.findUniqueOrThrow(id);

    const availableRes: PhotoSizeDto[] = [];
    let height = photo.height;

    if (photo.status === 'PENDING') {
      for (
        let i = photo.width;
        i >= PhotoConstant.MIN_PHOTO_WIDTH;
        i -= Math.floor((i * 20) / 100)
      ) {
        const previewUrl = `${process.env.BACKEND_ORIGIN}/photo/${photo.id}/temporary-photo?width=${i}`;
        availableRes.push(new PhotoSizeDto(i, height, previewUrl));

        height -= Math.floor((height * 20) / 100);
      }

      return availableRes;
    }

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

    let url = photoDetail.watermark
      ? photoDetail.watermarkPhotoUrl
      : photoDetail.originalPhotoUrl;

    if (photoDetail.watermark && url.length === 0) {
      const updatedPhoto = await this.sendImageWatermarkQueue(
        photoDetail.photographerId,
        photoDetail.id,
        {
          text: 'PXL',
        },
      );

      url = updatedPhoto.watermarkPhotoUrl;
    }

    if (url.length == 0) {
      console.log(
        `error photo without thumbnail or original: ${photoDetail.id}`,
      );
    }

    if (photoDetail.status === 'PENDING') {
      signedPhotoDto.signedUrl = {
        url: `${process.env.BACKEND_ORIGIN}/photo/${photoDetail.id}/temporary-photo`,
        thumbnail: `${process.env.BACKEND_ORIGIN}/photo/${photoDetail.id}/temporary-photo`,
      };
    } else {
      signedPhotoDto.signedUrl = {
        url: this.bunnyService.getPresignedFile(url),
        thumbnail: this.bunnyService.getPresignedFile(
          `thumbnail/${photoDetail.id}.webp`,
        ),
      };
    }

    signedPhotoDto.photoSellings?.forEach((photoSelling) => {
      photoSelling.pricetags.forEach((pricetag) => {
        if (photoDetail.status === 'PENDING') {
          pricetag.preview = `${process.env.BACKEND_ORIGIN}/photo/${photoDetail.id}/temporary-photo?width=${pricetag.width}`;
        } else {
          pricetag.preview = this.bunnyService.getPresignedFile(
            photoDetail.watermarkPhotoUrl,
            `?width=${pricetag.width}`,
          );
        }
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

    if (photo.status === 'PENDING') {
      signedPhotoDto.signedUrl = {
        url: `${process.env.BACKEND_ORIGIN}/photo/${photo.id}/temporary-photo`,
        thumbnail: `${process.env.BACKEND_ORIGIN}/photo/${photo.id}/temporary-photo`,
      };

      return signedPhotoDto;
    }

    const signedUrl = this.bunnyService.getPresignedFile(url);
    const signedThumbnailUrl = this.bunnyService.getPresignedFile(
      `thumbnail/${photo.id}.webp`,
    );

    signedPhotoDto.signedUrl = {
      url: signedUrl,
      thumbnail: signedThumbnailUrl,
    };

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
      photoSellings: {
        every: {
          active: false,
        },
      },
    });

    const photos = await this.photoRepository.findAll(
      {
        visibility: 'PUBLIC',
        photoType: 'RAW',
        photoSellings: {
          every: {
            active: false,
          },
        },
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

    await this.photoRepository.deleteById(photo.id);

    await this.userService.updatePhotoQuota(userId, photo.size);

    return true;
  }

  async findById(
    userId: string,
    id: string,
    validateOwnership: boolean = true,
  ) {
    const photo = await this.photoRepository.findUniqueOrThrow(id, userId);

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

  async uploadBookingPhoto(
    userId: string,
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
      const storageObjectKey = await this.bunnyService.upload(
        photoUploadDto.file,
      );

      const normalizedTitle = Utils.normalizeText(
        photoUploadDto.file.originalName,
      );

      const metadata = await this.photoProcessService.parseMetadataFromBuffer(
        photoUploadDto.file.buffer,
      );

      const blurHash: string = await this.photoProcessService.bufferToBlurhash(
        photoUploadDto.file.buffer,
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
        exif: {},
        width: metadata.width,
        height: metadata.height,
        status: 'PARSED',
        photoType: 'BOOKING',
        blurHash,
        watermark: false,
        visibility: 'PRIVATE',
        originalPhotoUrl: storageObjectKey,
        watermarkPhotoUrl: '',
      });

      await this.userRepository.update(userId, {
        photoQuotaUsage: {
          increment: photo.size,
        },
      });

      await this.photoProcessQueue.add(PhotoConstant.PROCESS_PHOTO_JOB_NAME, {
        id: photo.id,
      });

      return this.signPhoto(photo);
    } catch (e) {
      console.log(e);
      if (e instanceof HttpException) {
        throw e;
      }

      throw new UploadPhotoFailedException(e);
    }
  }

  async fileSystemPhotoUpload(
    userId: string,
    photoUploadDto: FileSystemPhotoUploadRequestDto,
  ) {
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

    let exifRaw = await this.photoProcessService.parseExifFromFilePath(
      photoUploadDto.file.path,
    );

    const metadata = await this.photoProcessService.parseMetadataFromFilePath(
      photoUploadDto.file.path,
    );

    if (!exifRaw) {
      throw new ExifNotFoundException();
    }

    const exif = JSON.parse(Utils.removedNullChar(JSON.stringify(exifRaw)));

    if (!exif['Make']) {
      throw new MissingMakeExifException();
    }

    if (!exif['Model']) {
      throw new MissingModelExifException();
    }

    exif['Copyright'] = ` © copyright by ${user.name}`;

    const sharp = await this.photoProcessService.sharpInitFromFilePath(
      photoUploadDto.file.path,
    );

    const buffer = await sharp.toBuffer();

    const hash = await this.photoProcessService.getHashFromBuffer(buffer);

    const allPreviousHashs = await this.photoRepository.findAllHash();

    const compareHashs = allPreviousHashs.map((h) => h.hash);
    const sameHashPhoto = this.photoProcessService.isExistHash(
      hash,
      compareHashs,
    );

    if (sameHashPhoto) {
      throw new FailToPerformOnDuplicatedPhotoException();
    }

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
      hash,
      size: photoUploadDto.file.size,
      exif,
      width: metadata.width,
      height: metadata.height,
      status: 'PENDING',
      photoType: 'RAW',
      blurHash: 'UhCa0+RjM|oJlCWBaeaeESofoeaxIVj[j?j?',
      watermark: false,
      visibility: 'PRIVATE',
      originalPhotoUrl: photoUploadDto.file.path,
      watermarkPhotoUrl: '',
    });

    await this.userRepository.update(userId, {
      photoQuotaUsage: {
        increment: photo.size,
      },
    });

    const temporaryPhotoDto: TemporaryPhotoDto = {
      file: photoUploadDto.file,
      photoId: photo.id,
    };

    await this.photoProcessQueue.add(
      PhotoConstant.UPLOAD_PHOTO_JOB_NAME,
      temporaryPhotoDto,
    );

    return this.signPhoto(photo);
  }

  async uploadPhoto(
    userId: string,
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
      let performance = Date.now();
      let exifRaw = await this.photoProcessService.parseExifFromBuffer(
        photoUploadDto.file.buffer,
      );

      const metadata = await this.photoProcessService.parseMetadataFromBuffer(
        photoUploadDto.file.buffer,
      );

      console.log(`parse exif, metadata: ${Date.now() - performance}`);

      if (!exifRaw) {
        throw new ExifNotFoundException();
      }

      const exif = JSON.parse(Utils.removedNullChar(JSON.stringify(exifRaw)));

      if (!exif['Make']) {
        throw new MissingMakeExifException();
      }

      if (!exif['Model']) {
        throw new MissingModelExifException();
      }

      performance = Date.now();

      await this.photoValidateService.validateHashAndMatching(
        photoUploadDto.file.buffer,
        photoUploadDto.file.originalName,
      );

      this.logger.log(`validate hash: `, Date.now() - performance);

      exif['Copyright'] = ` © copyright by ${user.name}`;

      performance = Date.now();

      const storageObjectKey = await this.bunnyService.upload(
        photoUploadDto.file,
      );

      this.logger.log(`upload bunny service: `, Date.now() - performance);

      performance = Date.now();

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
        photoType: 'RAW',
        blurHash: 'UhCa0+RjM|oJlCWBaeaeESofoeaxIVj[j?j?',
        watermark: false,
        visibility: 'PRIVATE',
        originalPhotoUrl: storageObjectKey,
        watermarkPhotoUrl: '',
      });

      await this.userRepository.update(userId, {
        photoQuotaUsage: {
          increment: photo.size,
        },
      });

      await this.photoProcessQueue.add(PhotoConstant.PROCESS_PHOTO_JOB_NAME, {
        id: photo.id,
      });

      await this.cameraQueue.add(CameraConstant.ADD_NEW_CAMERA_USAGE_JOB, {
        photoId: photo.id,
      });

      this.logger.log(
        `crete, update, process queue, camera queue: `,
        Date.now() - performance,
      );

      return this.signPhoto(photo);
    } catch (e) {
      console.log(e);
      if (e instanceof HttpException) {
        throw e;
      }

      throw new UploadPhotoFailedException(e);
    }
  }
}
