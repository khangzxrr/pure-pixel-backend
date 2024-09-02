import { Inject, Injectable } from '@nestjs/common';
import { PhotoVisibility } from '@prisma/client';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoIsPrivatedException } from '../exceptions/photo-is-private.exception';

@Injectable()
export class PhotoService {
  constructor(@Inject() private readonly photoRepository: PhotoRepository) {}

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
}
