import { Inject } from '@nestjs/common';
import { CategoryRepository } from 'src/database/repositories/category.repository';

export class PhotoCategoryService {
  constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
  ) {}

  async findAll() {
    return await this.categoryRepository.findAll();
  }
}
