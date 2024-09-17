import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  Res,
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/presigned-upload-url.response.dto';
import { ProcessImagesRequest } from '../dtos/process-images.request.dto';
import { PhotoDto, SignedPhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequest } from '../dtos/photo-update.request.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';

import { Response } from 'express';
import { ParsedUserDto } from 'src/user/dto/parsed-user.dto';

@Controller('photo')
@ApiTags('photo')
export class PhotoController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Get('/public')
  @ApiOperation({
    summary: 'get public photos',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'array of photos',
    type: PhotoDto,
    isArray: true,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto(@Query() findPhotoFilter: FindAllPhotoFilterDto) {
    return await this.photoService.findPublicPhotos(findPhotoFilter);
  }

  //TODO: finish get comments API
  @Get('/id:/comment')
  @ApiOperation({
    summary: 'get comments of photo',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getComments() {
    throw new NotImplementedException();
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'get photo by id',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'return image',
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getPhoto(@AuthenticatedUser() user, @Param('id') id: string) {
    return await this.photoService.getPhotoById(user ? user.sub : '', id);
  }

  //TODO: webhook handle sftp
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async parseExifviaWebhook(@Query() query) {
    console.log(query);
    console.log('call from webhook');

    return 'cool';
  }

  @Get('/id:/status')
  @ApiOperation({
    summary: 'get photo status (can be used for polling in process API)',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'status',
  })
  async getPhotoStatus() {}

  @Post('/process')
  @ApiOperation({
    summary:
      'put process image request to queue inorder to generate watermark, thumbnail, exif images after upload',
  })
  @ApiResponse({
    status: HttpStatusCode.Accepted,
    description: 'puted process request to process queue',
    isArray: true,
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async processPhotos(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() processImagesRequest: ProcessImagesRequest,
    @Res() res: Response,
  ) {
    await this.photoService.sendProcessImageToMq(
      user.sub,
      processImagesRequest,
    );

    res.status(HttpStatus.ACCEPTED).send();
  }

  @Patch('/update')
  @ApiOperation({
    summary: 'update one or more fields of photos',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    isArray: true,
    type: PhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async updatePhotos(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() body: PhotoUpdateRequest,
  ) {
    return this.photoService.updatePhotos(user.sub, body.photos);
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
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() body: PresignedUploadUrlRequest,
  ) {
    const presignedUrl = await this.photoService.getPresignedUploadUrl(
      user.sub,
      body,
    );

    return presignedUrl;
  }
}
