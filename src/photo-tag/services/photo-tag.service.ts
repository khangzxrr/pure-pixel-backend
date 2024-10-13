import { Inject } from '@nestjs/common';
import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';

export class PhotoTagService {
  constructor(
    @Inject() private readonly photoTagRepository: PhotoTagRepository,
  ) {}

  async getTop(top: number) {
    return await this.photoTagRepository.groupBy(top);
  }
}
