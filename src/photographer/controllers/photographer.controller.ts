import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { FindAllPhotographerRequestDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotographerDTO } from '../dtos/photographer.dto';

import { PhotographerProfileDto } from '../dtos/photographer-profile.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

@Controller('photographer')
@ApiTags('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: 'get all photographers',
  })
  @ApiOkResponsePaginated(PhotographerDTO)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async findAllPhotographers(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllRequestDto: FindAllPhotographerRequestDto,
  ) {
    return this.photographerService.getAllPhotographer(
      user ? user.sub : '',
      findAllRequestDto,
    );
  }

  @Get('/:id/profile')
  @ApiOperation({
    summary: 'get photographer profile by id',
  })
  @ApiOkResponse({
    type: PhotographerProfileDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getPhotographerProfile(@Param('id') id: string) {
    return await this.photographerService.getPhotographerProfileById(id);
  }

  @Get('/me/photo')
  @ApiOperation({
    summary: 'get all photos of mine',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async getPhotoOfMine(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query()
    filter: FindAllPhotoFilterDto,
  ) {
    return await this.photographerService.getPhotosOfMe(user.sub, filter);
  }
}
