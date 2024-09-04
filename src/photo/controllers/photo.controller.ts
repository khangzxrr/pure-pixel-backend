import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/presigned-upload-url.response.dto';
import { ProcessImagesRequest } from '../dtos/process-images.request.dto';
import { Response } from 'express';

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

  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async parseExifviaWebhook(@Query() query) {
    console.log(query);
    console.log('call from webhook');

    return 'cool';
  }

  @Post('/process')
  @ApiOperation({ summary: 'generate watermark images after upload' })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'processed successfully',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async processPhotos(
    @AuthenticatedUser() user,
    @Body() processImagesRequest: ProcessImagesRequest,
    @Res() res: Response,
  ) {
    await this.photoService.processImages(user.sub, processImagesRequest);

    res.status(HttpStatus.OK).send();
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
