import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoshootPackageDetailDto } from '../dtos/photoshoot-package-detail.dto';
import { PhotoshootPackageDetailCreateDto } from '../dtos/rest/photoshoot-package-detail.create.request.dto';
import { PhotoshootPackageDetailReplaceDto } from '../dtos/rest/photoshoot-package-detail.replace.request.dto';
import { PhotoshootPackageDetailUpdateDto } from '../dtos/rest/photoshoot-package-detail.update.request.dto';
import { PhotoshootPackageService } from '../services/photoshoot-package.service';

@Controller('photoshoot-package-detail')
@ApiTags('photoshoot-package-detail')
export class PhotoshootPackageDetailController {
  constructor(
    private readonly photoshootPackageService: PhotoshootPackageService,
  ) {}

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

  @Patch(':packageId/detail/:detailId')
  @ApiOperation({
    summary:
      'update a field of photoshoot package detail by packageId and detailId',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDetailDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async updateDetail(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('packageId') packageId: string,
    @Param('detailId') detailId: string,
    @Body() updateDto: PhotoshootPackageDetailUpdateDto,
  ) {
    return await this.photoshootPackageService.updateDetail(
      user.sub,
      packageId,
      detailId,
      updateDto,
    );
  }

  @Put(':packageId/detail/:detailId')
  @ApiOperation({
    summary:
      'replace all fields of photoshoot package detail by packageId and detailId',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDetailDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async replaceDetail(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('packageId') packageId: string,
    @Param('detailId') detailId: string,
    @Body() replaceDto: PhotoshootPackageDetailReplaceDto,
  ) {
    return await this.photoshootPackageService.updateDetail(
      user.sub,
      packageId,
      detailId,
      replaceDto,
    );
  }

  @Delete(':packageId/detail/:detailId')
  @ApiOperation({
    summary: 'delete a photoshoot package detail by packageId and detailId',
  })
  @ApiOkResponse({
    type: PhotoshootPackageDetailDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async deleteDetail(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('packageId') packageId: string,
    @Param('detailId') detailId: string,
  ) {
    return await this.photoshootPackageService.deleteDetail(
      user.sub,
      packageId,
      detailId,
    );
  }
}
