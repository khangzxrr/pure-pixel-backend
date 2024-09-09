import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PhotoCategoryService } from '../services/photo-category.service';
import { HttpStatusCode } from 'axios';
import { PhotoCategoryDto } from '../dtos/photo-category.dto';

@Controller('category')
@ApiTags('category')
export class PhotoCategoryController {
  constructor(
    @Inject() private readonly photoCategoryService: PhotoCategoryService,
  ) {}

  @Get()
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
