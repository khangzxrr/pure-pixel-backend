import { Inject, Injectable } from '@nestjs/common';
import { PhotoRepository } from 'src/database/repositories/photo.repository';

@Injectable()
export class PhotoService {
  constructor(@Inject() private readonly photoRepository: PhotoRepository) {}

  async findAllByVisibility(visibilityStr: string) {
    return await this.photoRepository.getAllByVisibility(visibilityStr);
  }
}
