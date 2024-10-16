import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PhotoshootPackageService } from '../services/photoshoot-package.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { PhotoshootPackageCreateRequestDto } from '../dtos/rest/photoshoot-package-create.request.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { FormDataRequest } from 'nestjs-form-data';
import { PhotoshootPackageDetailDto } from '../dtos/photoshoot-package-detail.dto';
import { PhotoshootPackageDetailCreateDto } from '../dtos/rest/photoshoot-package-detail.create.request.dto';

@Controller('photoshoot-package')
@ApiTags('photoshoot-package')
export class PhotoShootPackageController {
  constructor(
    private readonly photoshootPackageService: PhotoshootPackageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get all photoshoot package of a photographer by userid',
  })
  @ApiOkResponsePaginated(PhotoshootPackageDto)
  async findAll(@Query() findAllDto: PhotoshootPackageFindAllDto) {
    return await this.photoshootPackageService.findAll(findAllDto);
  }

  @Post()
  @ApiOperation({
    summary: 'create new photoshoot package',
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async create(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createDto: PhotoshootPackageCreateRequestDto,
  ) {
    return await this.photoshootPackageService.create(user.sub, createDto);
  }

  @Post(':id/detail')
  @ApiOperation({
    summary: 'create detail for a photoshoot package by photoshootPackageId',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDetailDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async createDetail(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() createDto: PhotoshootPackageDetailCreateDto,
  ) {
    return await this.photoshootPackageService.createDetail(
      user.sub,
      id,
      createDto,
    );
  }
}
