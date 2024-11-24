import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

import { AuthGuard, Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { FormDataRequest } from 'nestjs-form-data';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoshootPackageShowcaseDto } from '../dtos/photoshoot-package-showcase.dto';
import { PhotoshootPackageShowcaseUpdateDto } from '../dtos/rest/photoshoot-package-showcase.update.dto';
import { Constants } from 'src/infrastructure/utils/constants';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotoshootPackageShowcaseFindAllDto } from '../dtos/rest/photoshoot-package-showcase.find-all.request.dto';

@Controller('photographer/photoshoot-package-showcase')
@ApiTags('photographer-photoshoot-package-showcase')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
export class PhotographerPhotoshootPackageShowCaseController {
  constructor(
    private readonly photoshootPackageService: PhotoshootPackageService,
  ) {}

  @Get('/photoshoot-package/:photoshootPackageId')
  @ApiOperation({
    summary: 'get all showcase of photoshoot package by photoshootPackageId',
  })
  @ApiOkResponsePaginated(PhotoshootPackageShowcaseDto)
  async findAll(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoshootPackageId') id: string,
    @Query() findallDto: PhotoshootPackageShowcaseFindAllDto,
  ) {
    return await this.photoshootPackageService.findAllShowcase(
      user.sub,
      id,
      findallDto,
    );
  }

  @Post('/photoshoot-package/:photoshootPackageId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'create new showcase',
  })
  @FormDataRequest()
  @ApiOkResponse({
    type: PhotoshootPackageShowcaseDto,
  })
  async createShowcase(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoshootPackageId') id: string,
    @Body() createDto: PhotoshootPackageShowcaseUpdateDto,
  ) {
    return await this.photoshootPackageService.createShowcase(
      user.sub,
      id,
      createDto,
    );
  }

  @Put(':showcaseId/:photoshootPackageId')
  @ApiOperation({
    summary: 'update photoshoot package by id and showcaseId',
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOkResponse({
    type: PhotoshootPackageShowcaseDto,
  })
  async replaceShowcaseById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoshootPackageId') id: string,
    @Param('showcaseId') showcaseId: string,
    @Body() updateShowcaseDto: PhotoshootPackageShowcaseUpdateDto,
  ) {
    return await this.photoshootPackageService.replaceShowcase(
      user.sub,
      id,
      showcaseId,
      updateShowcaseDto,
    );
  }

  @Delete(':showcaseId/photoshoot-package/:photoshootPackageId')
  @ApiOperation({
    summary: 'delete photoshoot package showcase by id and showcaseId',
  })
  async deleteShowcaseById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoshootPackageId') id: string,
    @Param('showcaseId') showcaseId: string,
  ) {
    return await this.photoshootPackageService.deleteShowcase(
      user.sub,
      id,
      showcaseId,
    );
  }
}
