import { Inject, Injectable, Logger } from '@nestjs/common';
import { PhotoStatus, PhotoVisibility } from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { StorageService } from 'src/storage/services/storage.service';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import {
  PresignedUploadUrlResponse,
  SignedUpload,
} from '../dtos/presigned-upload-url.response.dto';
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
import { ProcessPhotosRequest } from '../dtos/process-images.request.dto';
import { GenerateWatermarkRequestDto } from '../dtos/generate-watermark.request.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotographerNotFoundException } from 'src/photographer/exceptions/photographer-not-found.exception';
import { RunOutPhotoQuotaException } from '../exceptions/run-out-photo-quota.exception';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject() private readonly databaseService: DatabaseService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly storageService: StorageService,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
  ) {}

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
    await this.photoProcessQueue.add(PhotoConstant.GENERATE_WATERMARK_JOB, {
      userId,
      generateWatermarkRequest,
    });
  }
  async sendProcessImageToMq(
    userId: string,
    processPhotosRequest: ProcessPhotosRequest,
  ) {
    await this.photoProcessQueue.add(PhotoConstant.PROCESS_PHOTO_JOB_NAME, {
      userId,
      processPhotosRequest,
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

    const signedUrl = await this.storageService.getSignedGetUrl(url);
    const signedThumbnail =
      await this.storageService.getSignedGetUrl(thumbnail);

    return new SignedUrl(signedUrl, signedThumbnail);
  }

  async updatePhotos(
    userId: string,
    photoDtos: PhotoDto[],
  ): Promise<PhotoDto[]> {
    const photos = photoDtos.map((dto) => {
      if (dto.photographerId != userId) {
        throw new NotBelongPhotoException();
      }

      //set undefined to prevent update what user shouldn't
      dto.photographerId = undefined;
      dto.thumbnailPhotoUrl = undefined;
      dto.originalPhotoUrl = undefined;
      dto.watermarkPhotoUrl = undefined;
      dto.watermarkThumbnailPhotoUrl = undefined;
      dto.updatedAt = undefined;
      dto.createdAt = undefined;

      dto.categoryId = undefined;

      return Photo.fromDto(dto);
    });

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
    const photos =
      await this.photoRepository.findAllIncludedPhotographer(filter);

    const signedPhotoDtoPromises = photos.map(async (p) => {
      const signedPhotoDto = new SignedPhotoDto({
        photographer: p.photographer,
        ...p,
      });

      const signedUrls = await this.signUrlFromPhotos(p);

      signedPhotoDto.signedUrl = signedUrls;

      return signedPhotoDto;
    });

    return await Promise.all(signedPhotoDtoPromises);
  }

  async deleteById(userId: string, photoId: string) {
    const photo = await this.photoRepository.getPhotoById(photoId);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (photo.photographerId !== userId) {
      throw new NotBelongPhotoException();
    }

    await this.photoRepository.delete(photoId);

    return true;
  }

  async getSignedPhotoById(userId: string, id: string) {
    const photo = await this.photoRepository.getPhotoDetailById(id);

    if (!photo) {
      throw new PhotoNotFoundException();
    }

    if (
      photo.visibility == PhotoVisibility.PRIVATE &&
      photo.photographerId !== userId
    ) {
      throw new PhotoIsPrivatedException();
    }

    const signedPhotoDto = new SignedPhotoDto({
      photographer: photo.photographer,
      ...photo,
    });

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

    let signedUploads = await Promise.all(
      presignedUploadUrlRequest.filenames.map(async (filename) => {
        const extension = Utils.regexFileExtension.exec(filename)[1];

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

        //generate presigned url
        const url =
          await this.storageService.getPresignedUploadUrl(storageObjectKey);

        //map correct url with filename
        return new SignedUpload(filename, url, storageObjectKey, '');
      }),
    );

    //covert array of signed uploads to directory for attach photo ID easier
    const signedUploadMap = new Map();

    signedUploads.reduce((result, signedUpload) => {
      result[signedUpload.storageObject] = signedUpload;

      return result;
    }, signedUploadMap);

    const photos = await this.photoRepository.createTemporaryPhotos(
      userId,
      signedUploads,
    );

    //attach photo id then covert it back to array of signed uploads
    signedUploads = photos.map(({ id, originalPhotoUrl }) => {
      const signedUpload = signedUploadMap[originalPhotoUrl];
      signedUpload.photoId = id;

      return signedUpload;
    });

    return new PresignedUploadUrlResponse(signedUploads);
  }
}
