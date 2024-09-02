import {
  Body,
  Controller,
  Get,
  Inject,
  NotImplementedException,
  Param,
  Post,
  Query,
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
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/presigned-upload-url.response.dto';
import { Console } from 'console';

@Controller('photo')
export class PhotoController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Get('/public')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto() {
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

  //idk, why we cant use '-' in path
  //it will cause keycloak return 401
  @Get('/webhook/exif')
  @ApiOperation({ summary: 'parse exif from photo for webhook API' })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'parsed exif',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async parseExifviaWebhook(@Query() query) {
    console.log(query);
    console.log('call from webhook');

    return 'cool';
  }

  @Post('/upload')
  @ApiOperation({ summary: 'generate presigned upload urls for files' })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: PresignedUploadUrlResponse,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async getPresignedUploadUrl(
    @AuthenticatedUser() user,
    @Body() body: PresignedUploadUrlRequest,
  ) {
    const presignedUrl = await this.photoService.getPresignedUploadUrl(
      user.sub,
      body,
    );

    return presignedUrl;
  }
}
