import {
  Controller,
  Get,
  Inject,
  NotImplementedException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PhotoService } from '../services/photo.service';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';

@Controller('photo')
export class PhotoController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Get('/public')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto() {
    console.log('get public');
    return await this.photoService.findAllByVisibility('PUBLIC');
  }

  @Get('/:key')
  @Public()
  async getPhoto(@AuthenticatedUser() user, @Param('key') id: string) {
    return await this.photoService.getPhotoById(user ? user.sub : '', id);
  }

  @Post('/:key/parse-exif')
  @ApiOperation({ summary: 'parse exif from photo' })
  @ApiResponse({
    status: HttpStatusCode.Accepted,
    description: 'accepted photo, put it in queue to be processed later',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async parseExif() {
    throw new NotImplementedException();
  }

  @Post('/:key/watermark')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async watermark() {
    throw new NotImplementedException();
  }
}
