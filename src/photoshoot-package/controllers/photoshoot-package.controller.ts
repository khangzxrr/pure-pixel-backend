import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoshootPackageService } from '../services/photoshoot-package.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';

@Controller('photoshoot-package')
@ApiTags('photoshoot-package')
export class PhotoShootPackageController {
  constructor(
    private readonly photoshootPackageService: PhotoshootPackageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'find all photoshoot package',
  })
  @ApiOkResponsePaginated(PhotoshootPackageDto)
  async findAll(@Query() findAllDto: PhotoshootPackageFindAllDto) {
    findAllDto.statuses = ['ENABLED'];
    return await this.photoshootPackageService.findAll(findAllDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'find photoshoot package by id',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  async findPhotoshootPackageById(@Param('id') id: string) {
    return await this.photoshootPackageService.getById(id);
  }

  @Get('/photographer/:photographerId')
  @ApiOperation({
    summary: 'get all photoshoot package of a photographer by photographerId',
  })
  @ApiOkResponsePaginated(PhotoshootPackageDto)
  async findAllWithPhotographerId(
    @Param('photographerId') photographerId: string,
    @Query() findAllDto: PhotoshootPackageFindAllDto,
  ) {
    return await this.photoshootPackageService.findAllByUserId(
      photographerId,
      findAllDto,
    );
  }
}
