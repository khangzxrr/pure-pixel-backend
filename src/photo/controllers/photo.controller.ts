import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
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
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { PresignedUploadUrlRequest } from '../dtos/rest/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/rest/presigned-upload-url.response.dto';
import { PhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';

import { Response } from 'express';
import { CommentService } from '../services/comment.service';
import { CreateCommentRequestDto } from '../dtos/rest/create-comment.request.dto';
import { CommentEntity } from '../entities/comment.entity';
import { ProcessPhotosRequest } from '../dtos/rest/process-images.request.dto';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { SharePhotoRequestDto } from '../dtos/rest/share-photo.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { SharePhotoResponseDto } from '../dtos/rest/share-photo-response.dto';
import { SignedPhotoSharingDto } from '../dtos/signed-photo-sharing.dto';
import { ResolutionDto } from '../dtos/resolution.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';

@Controller('photo')
@ApiTags('photo')
export class PhotoController {
  constructor(
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly commentService: CommentService,
  ) {}

  @Get('/public')
  @ApiOperation({
    summary: 'get public photos',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto(@Query() findPhotoFilter: FindAllPhotoFilterDto) {
    return await this.photoService.findPublicPhotos(findPhotoFilter);
  }

  //TODO: finish get comments API
  @Get('/:id/comment')
  @ApiOperation({
    summary: 'get comments of photo',
  })
  @ApiOkResponse({
    type: CommentEntity,
    isArray: true,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getComments(@Param('id') id: string): Promise<CommentEntity[]> {
    return await this.commentService.findAllByPhotoId(id);
  }

  @Post('/:id/comment')
  @ApiOperation({
    summary: 'create a comment to photo',
  })
  @ApiOkResponse({
    type: CommentEntity,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async createComment(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() createCommentRequestDto: CreateCommentRequestDto,
  ): Promise<CommentEntity> {
    return await this.commentService.createComment(
      id,
      user.sub,
      createCommentRequestDto,
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
  async getPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.getSignedPhotoById(user ? user.sub : '', id);
  }

  //TODO: webhook handle sftp
  // @UseGuards(AuthGuard, KeycloakRoleGuard)
  // @Public(false)
  // async parseExifviaWebhook(@Query() query) {
  //   console.log(query);
  //   console.log('call from webhook');
  //
  //   return 'cool';
  // }

  @Post('/watermark')
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
    @Res() res: Response,
  ) {
    await this.photoService.sendWatermarkRequest(
      user.sub,
      generateWatermarkRequest,
    );

    res.status(HttpStatus.ACCEPTED).send();
  }

  @Post('/process')
  @ApiOperation({
    summary:
      'put process image request to queue inorder to generate thumbnail, exif images after upload',
  })
  @ApiResponse({
    status: HttpStatusCode.Accepted,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async processPhotos(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() processPhotosRequest: ProcessPhotosRequest,
    @Res() res: Response,
  ) {
    await this.photoService.sendProcessImageToMq(
      user.sub,
      processPhotosRequest,
    );

    res.status(HttpStatus.ACCEPTED).send();
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
  async updatePhotos(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() photoUpdateDto: PhotoUpdateRequestDto,
  ) {
    return await this.photoService.updatePhoto(user.sub, id, photoUpdateDto);
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

  @Get('/:sharedPhotoId/get-shared')
  @ApiOperation({
    summary: 'get shared photo detail by id',
  })
  @ApiOkResponse({
    type: SignedPhotoSharingDto,
  })
  async getSharedPhotoDetail(@Param('sharedPhotoId') sharedPhotoId: string) {
    return await this.photoService.getSharedPhotoById(sharedPhotoId);
  }

  @Get('/:id/get-list-shared')
  @ApiOperation({
    summary: 'get all shared link of a photo by id',
  })
  @ApiOkResponse({
    isArray: true,
    type: SharePhotoResponseDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async findAllShared(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') photoId: string,
  ) {
    return await this.photoService.findAllShared(user.sub, photoId);
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
