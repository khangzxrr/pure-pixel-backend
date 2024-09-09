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
import { ProcessImagesRequest } from '../dtos/process-images.request.dto';
import { PhotoProcessService } from './photo-process.service';
import { PhotoDto, SignedPhotoDto } from '../dtos/photo.dto';
import { Photo } from '../entities/photo.entity';
import { NotBelongPhotoException } from '../exceptions/not-belong-photo.exception';
import { PhotoIsPendingStateException } from '../exceptions/photo-is-pending-state.exception';
import { SignedUrl } from '../dtos/photo-signed-url.dto';
import { PhotoFindAllFilterDto } from '../dtos/find-all.filter.dto';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly storageService: StorageService,
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

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

    console.log(photos);

    const updateResults = await this.photoRepository.batchUpdate(photos);

    return updateResults.map((p) => p as PhotoDto);
  }

  //TODO: async process using bullmq
  async processImages(
    userId: string,
    processImagesRequest: ProcessImagesRequest,
  ): Promise<SignedPhotoDto[]> {
    const photoIds = processImagesRequest.signedUploads.map((su) => su.photoId);

    const photos = await this.photoRepository.getPhotoByIdsAndStatus(
      photoIds,
      'PENDING',
      userId,
    );

    const updatePhotoPromises = photos.map(async (p) => {
      const thumbnailKey = await this.photoProcessService.thumbnail(
        p.originalPhotoUrl,
      );
      p.thumbnailPhotoUrl = thumbnailKey;

      const watermarkThumbnailKey =
        await this.photoProcessService.watermark(thumbnailKey);
      p.watermarkThumbnailPhotoUrl = watermarkThumbnailKey;

      const watermarkImageKey = await this.photoProcessService.watermark(
        p.originalPhotoUrl,
      );
      p.watermarkPhotoUrl = watermarkImageKey;

      //this is not optimized because we have to get original image from url
      //each time we call different process method
      //wasting bandwidth!
      //please fix this if we have time
      const exifs = await this.photoProcessService.parseExif(
        p.originalPhotoUrl,
      );
      p.exif = exifs;

      p.status = 'PARSED';

      this.logger.log(`generated thumbnail: ${thumbnailKey}`);
      this.logger.log(
        `generated watermark thumbnail: ${watermarkThumbnailKey}`,
      );
      this.logger.log(`generated watermark image: ${watermarkImageKey}`);

      return p;
    });

    const updatePhotos = await Promise.all(updatePhotoPromises);

    const updatedPhotos = await this.photoRepository.batchUpdate(updatePhotos);

    const signedPhotoDtoPromises = updatedPhotos.map(async (p) => {
      const signedPhotoDto = p as SignedPhotoDto;

      const signedUrls = await this.signUrlFromPhotos(p);

      signedPhotoDto.signedUrl = signedUrls;

      return signedPhotoDto;
    });

    return await Promise.all(signedPhotoDtoPromises);
  }

  async findPublicPhotos() {
    const filter = new PhotoFindAllFilterDto();
    filter.visibility = PhotoVisibility.PUBLIC;
    filter.status = PhotoStatus.PARSED;

    const photos = await this.photoRepository.findAll(filter);

    const signedPhotoDtoPromises = photos.map(async (p) => {
      const signedPhotoDto = p as SignedPhotoDto;

      const signedUrls = await this.signUrlFromPhotos(p);

      signedPhotoDto.signedUrl = signedUrls;

      return signedPhotoDto;
    });

    return await Promise.all(signedPhotoDtoPromises);
  }

  async findAll(filter: PhotoFindAllFilterDto) {
    const photos = await this.photoRepository.findAll(filter);

    const signedPhotoDtoPromises = photos.map(async (p) => {
      const signedPhotoDto = p as SignedPhotoDto;

      const signedUrls = await this.signUrlFromPhotos(p);

      signedPhotoDto.signedUrl = signedUrls;

      return signedPhotoDto;
    });

    return await Promise.all(signedPhotoDtoPromises);
  }

  async getPhotoById(userId: string, id: string) {
    const photo = await this.photoRepository.getPhotoById(id);

    if (
      photo.visibility == PhotoVisibility.PRIVATE &&
      photo.photographerId !== userId
    ) {
      throw new PhotoIsPrivatedException();
    }

    const signedPhotoDto = photo as SignedPhotoDto;

    const signedUrls = await this.signUrlFromPhotos(photo);

    signedPhotoDto.signedUrl = signedUrls;

    return signedPhotoDto;
  }

  async getPresignedUploadUrl(
    userId: string,
    presignedUploadUrlRequest: PresignedUploadUrlRequest,
  ): Promise<PresignedUploadUrlResponse> {
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
      console.log(signedUpload);
      signedUpload.photoId = id;

      return signedUpload;
    });

    return new PresignedUploadUrlResponse(signedUploads);
  }
}
