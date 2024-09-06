import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/presigned-upload-url.response.dto';
import { ProcessImagesRequest } from '../dtos/process-images.request.dto';
import { PhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequest } from '../dtos/photo-update.request.dto';

@Controller('photo')
@ApiTags('photo')
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
  @ApiOperation({
    summary: 'generate watermark, thumbnail, exif images after upload',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'processed successfully',
    isArray: true,
    type: PhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async processPhotos(
    @AuthenticatedUser() user,
    @Body() processImagesRequest: ProcessImagesRequest,
  ) {
    return await this.photoService.processImages(
      user.sub,
      processImagesRequest,
    );
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
    @AuthenticatedUser() user,
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
