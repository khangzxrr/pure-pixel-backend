import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { SignedPhotoDto } from 'src/photo/dtos/photo.dto';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { PhotoFindAllFilterDto } from 'src/photo/dtos/find-all.filter.dto';

@Controller('photographer')
@ApiTags('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}

  @Get('/me/photo')
  @ApiOperation({
    summary: 'get all photos of mine',
  })
  @ApiResponse({
    isArray: true,
    status: HttpStatusCode.Ok,
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async getPhotoOfMine(
    @AuthenticatedUser() user,
    @Query()
    filter: PhotoFindAllFilterDto,
  ) {
    return await this.photographerService.getPhotosOfMe(user.sub, filter);
  }
}
