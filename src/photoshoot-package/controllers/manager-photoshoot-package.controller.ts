import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { ManagePhotoshootPackageService } from '../services/manage-photoshoot-package.service';

import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { PhotoshootPackageFindAllResponseDto } from '../dtos/rest/photoshoot-package-find-all.response.dto';

@Controller('manager/photoshoot-package')
@ApiTags('manager-photoshoot-package')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.MANAGER_ROLE] })
export class ManagerPhotoShootPackageController {
  constructor(
    @Inject()
    private readonly managePhotoshootPackageService: ManagePhotoshootPackageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'find all photoshoot-package',
  })
  @ApiOkResponse({
    type: PhotoshootPackageFindAllResponseDto,
  })
  async findAllPhotoshootPackage(
    @Query() findAllDto: PhotoshootPackageFindAllDto,
  ) {
    return this.managePhotoshootPackageService.findAll(findAllDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'find photoshoot package by id',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  async findPhotoshootPackageById(@Param('id') id: string) {
    return await this.managePhotoshootPackageService.getById(id);
  }

  @Get('/photographer/:photographerId')
  @ApiOperation({
    summary: 'get all photoshoot package of  photographer by photographerId',
  })
  @ApiOkResponsePaginated(PhotoshootPackageDto)
  async findAllByPhotographer(
    @Param('photographerId') photographerId: string,
    @Query() findAllDto: PhotoshootPackageFindAllDto,
  ) {
    return await this.managePhotoshootPackageService.findAllByUserId(
      photographerId,
      findAllDto,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update photoshoot package by id',
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  async updatePhotoshoot(
    @Body() updateDto: PhotoshootPackageUpdateRequestDto,
    @Param('id') id: string,
  ) {
    return await this.managePhotoshootPackageService.update(id, updateDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'replace photoshoot package by id',
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  async replacePhotoshoot(
    @Body() replaceDto: PhotoshootPackageReplaceRequestDto,
    @Param('id') id: string,
  ) {
    return await this.managePhotoshootPackageService.replace(id, replaceDto);
  }

  @Delete(':packageId')
  @ApiOperation({
    summary: 'delete a photoshoot package  by packageId',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  async deletePhotoshootPackage(@Param('packageId') packageId: string) {
    return await this.managePhotoshootPackageService.delete(packageId);
  }
}
