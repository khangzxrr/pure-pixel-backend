import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
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
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { PhotoUploadRequestDto } from '../dtos/rest/photo-upload.request';
import { PhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';

import { Response } from 'express';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { SharePhotoRequestDto } from '../dtos/rest/share-photo.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ResolutionDto } from '../dtos/resolution.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';
import { FindNextPhotoFilterDto } from '../dtos/find-next.filter.dto';
import { FileSystemPhotoUploadRequestDto } from '../dtos/rest/file-system-photo-upload.request';
import { DownloadTemporaryPhotoDto } from '../dtos/rest/download-temporary-photo.request.dto';

@Controller('photo')
@ApiTags('photo')
export class PhotoController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Get('/public/next')
  @ApiOperation({
    summary: 'get next public photo',
  })
  @ApiOkResponse({
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getNextPublicPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findNextPhotoFilterDto: FindNextPhotoFilterDto,
  ) {
    return await this.photoService.findNextPublicPhotos(
      user ? user.sub : '',
      findNextPhotoFilterDto,
    );
  }

  @Get('/public')
  @ApiOperation({
    summary: 'get public photos',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findPhotoFilter: FindAllPhotoFilterDto,
  ) {
    return await this.photoService.findPublicPhotos(
      user ? user.sub : '',
      findPhotoFilter,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'delete a photo by id',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async deletePhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.deleteById(user.sub, id);
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
  async findPhotoById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.findById(user ? user.sub : '', id);
  }

  @Post(':id/watermark')
  @ApiOperation({
    summary: 'put photo to watermark queue inorder to generate watermark',
  })
  @ApiResponse({
    status: HttpStatusCode.Accepted,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async generateWatermark(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() generateWatermarkRequest: GenerateWatermarkRequestDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.sendImageWatermarkQueue(
      user.sub,
      id,
      generateWatermarkRequest,
    );
  }

  @Patch(':id')
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
  async updatePhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() photoUpdateDto: PhotoUpdateRequestDto,
  ) {
    return await this.photoService.updatePhoto(user.sub, id, photoUpdateDto);
  }

  @Post('/upload')
  @ApiOperation({ summary: 'upload and validate photo' })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: SignedPhotoDto,
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async uploadPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() body: PhotoUploadRequestDto,
  ) {
    const uploadPhotoResponse = await this.photoService.uploadPhoto(
      user.sub,
      body,
    );

    return uploadPhotoResponse;
  }

  @Post('/v2/upload')
  @ApiOperation({ summary: 'upload and serve temporary photo' })
  @ApiOkResponse({
    type: SignedPhotoDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @FormDataRequest({
    storage: FileSystemStoredFile,
    fileSystemStoragePath: '/tmp/purepixel-local-storage',
    cleanupAfterFailedHandle: true,
    cleanupAfterSuccessHandle: false,
  })
  async uploadPhotoV2(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() body: FileSystemPhotoUploadRequestDto,
  ) {
    const uploadPhotoResponse = await this.photoService.fileSystemPhotoUpload(
      user.sub,
      body,
    );

    return uploadPhotoResponse;
  }

  @Get(':id/temporary-photo')
  @ApiOperation({ summary: 'get file system temporary photo' })
  async downloadTemporaryPhoto(
    @Param('id') id: string,
    @Query() downloadTemporaryPhotoDto: DownloadTemporaryPhotoDto,
    @Res() res: Response,
  ) {
    const buffer = await this.photoService.downloadTemporaryPhoto(
      id,
      downloadTemporaryPhotoDto,
    );

    const stream = new StreamableFile(buffer);

    res.set({
      'Content-type': 'image/jpeg',
    });
    stream.getStream().pipe(res);
  }

  @Get('/:id/available-resolution')
  @ApiOperation({
    summary: 'get photo available scaling resolution',
  })
  @ApiResponse({
    status: 201,
    description:
      'indicate server is generating share urls, using websocket to listen to finish processing event',
  })
  @ApiOkResponse({
    isArray: true,
    type: ResolutionDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async getPhotoAvailableResolution(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.photoService.getAvailablePhotoResolution(id);

    if (result instanceof Boolean) {
      res.status(201).send();
      return;
    }

    res.status(200).send(result);
  }

  @Post('/share')
  @ApiOperation({
    summary: 'generate share url by photo id',
  })
  @ApiOkResponse({
    status: HttpStatusCode.Ok,
    type: String,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async sharePhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() body: SharePhotoRequestDto,
  ) {
    return await this.photoService.sharePhoto(user.sub, body);
  }
}
