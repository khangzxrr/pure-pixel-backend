import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { PhotoshootPackageService } from '../services/photoshoot-package.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { PhotoshootPackageCreateRequestDto } from '../dtos/rest/photoshoot-package-create.request.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { FileSystemPhotoshootPackageCreateRequestDto } from '../dtos/rest/file-system-photoshoot-package-create.request.dto';

@Controller('photographer/photoshoot-package')
@ApiTags('photographer-photoshoot-package')
export class PhotographerPhotoShootPackageController {
  constructor(
    private readonly photoshootPackageService: PhotoshootPackageService,
  ) {}

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

  @Get()
  @ApiOperation({
    summary: 'get all photoshoot package of current photographer',
  })
  @ApiOkResponsePaginated(PhotoshootPackageDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async findAllByPhotographer(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: PhotoshootPackageFindAllDto,
  ) {
    return await this.photoshootPackageService.findAllByUserId(
      user.sub,
      findAllDto,
    );
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

  @Post('v2')
  @ApiOperation({
    summary: 'create new photoshoot package v2 (filesystem upload)',
  })
  @FormDataRequest({
    storage: FileSystemStoredFile,
    fileSystemStoragePath: '/tmp/purepixel-local-storage',
    cleanupAfterFailedHandle: true,
    cleanupAfterSuccessHandle: false,
  })
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async createWithFileSystemUpload(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createDto: FileSystemPhotoshootPackageCreateRequestDto,
  ) {
    return await this.photoshootPackageService.filesystemCreate(
      user.sub,
      createDto,
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
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async updatePhotoshoot(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() updateDto: PhotoshootPackageUpdateRequestDto,
    @Param('id') id: string,
  ) {
    return await this.photoshootPackageService.update(user.sub, id, updateDto);
  }

  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @Put(':id')
  @ApiOperation({
    summary: 'replace photoshoot package by id',
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async replacePhotoshoot(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() replaceDto: PhotoshootPackageReplaceRequestDto,
    @Param('id') id: string,
  ) {
    return await this.photoshootPackageService.replace(
      user.sub,
      id,
      replaceDto,
    );
  }

  @Delete(':packageId')
  @ApiOperation({
    summary: 'delete a photoshoot package  by packageId',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async deletePhotoshootPackage(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('packageId') packageId: string,
  ) {
    return await this.photoshootPackageService.delete(user.sub, packageId);
  }
}
