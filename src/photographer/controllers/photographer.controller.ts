import {
  Controller,
  Get,
  Inject,
  NotImplementedException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { SignedPhotoDto } from 'src/photo/dtos/photo.dto';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { ParsedUserDto } from 'src/user/dto/parsed-user.dto';

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
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async findAllPhotographers(@AuthenticatedUser() user: ParsedUserDto) {
    if (user) {
      return this.photographerService.getAllPhotographerExceptUserId(user.sub);
    }

    return this.photographerService.getAllPhotographer();
  }

  //TODO: finish get all packages of photographer API
  @Get('/:id/package')
  @ApiOperation({
    summary: 'get all packages of photographer',
  })
  async findAllPackages() {
    throw new NotImplementedException();
  }

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
    filter: FindAllPhotoFilterDto,
  ) {
    return await this.photographerService.getPhotosOfMe(user.sub, filter);
  }
}
