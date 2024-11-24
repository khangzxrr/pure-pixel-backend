import { Controller, Get, Inject, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PhotoCategoryService } from '../services/photo-category.service';
import { HttpStatusCode } from 'axios';
import { PhotoCategoryDto } from '../dtos/photo-category.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('category')
@UseInterceptors(CacheInterceptor)
@ApiTags('category')
export class PhotoCategoryController {
  constructor(
    @Inject() private readonly photoCategoryService: PhotoCategoryService,
  ) {}

  @Get()
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'get all photo categories',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: PhotoCategoryDto,
    isArray: true,
  })
  async findAll() {
    return await this.photoCategoryService.findAll();
  }
}
