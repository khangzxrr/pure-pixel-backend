import { Inject, Injectable } from '@nestjs/common';
import { PhotoVisibility } from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';
import { StorageService } from 'src/storage/services/storage.service';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import {
  PresignedUploadUrlResponse,
  SingleSignedUrl,
} from '../dtos/presigned-upload-url.response.dto';
import { Utils } from 'src/infrastructure/utils/utils';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';

@Injectable()
export class PhotoService {
  constructor(
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly storageService: StorageService,
  ) {}

  async findAllByVisibility(visibilityStr: string) {
    return await this.photoRepository.getAllByVisibility(visibilityStr);
  }

  async getPhotoById(userId: string, id: string) {
    const photo = await this.photoRepository.getPhotoById(id);

    if (
      photo.visibility == PhotoVisibility.PRIVATE &&
      photo.photographerId !== userId
    ) {
      throw new PhotoIsPrivatedException();
    }

    return photo;
  }

  async getPresignedUploadUrl(
    userId: string,
    presignedUploadUrlRequest: PresignedUploadUrlRequest,
  ): Promise<PresignedUploadUrlResponse> {
    //regex extract file extension
    console.log(presignedUploadUrlRequest);

    const presignedUrls = await Promise.all(
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
        //generate presigned url
        const url = await this.storageService.getPresignedUploadUrl(
          userId + '/' + filename,
        );

        //map correct url with filename
        return new SingleSignedUrl(filename, url);
      }),
    );

    return new PresignedUploadUrlResponse(presignedUrls);
  }
}
