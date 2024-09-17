import {
  Body,
  Controller,
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
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/presigned-upload-url.response.dto';
import { ProcessImagesRequest } from '../dtos/process-images.request.dto';
import { PhotoDto, SignedPhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequest } from '../dtos/photo-update.request.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';

import { Response } from 'express';
import { ParsedUserDto } from 'src/user/dto/parsed-user.dto';
import { CommentService } from '../services/comment.service';
import { CreateCommentRequestDto } from '../dtos/create-comment.request.dto';
import { CommentEntity } from '../entities/comment.entity';

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
  @ApiResponse({
    status: HttpStatusCode.Ok,
    description: 'array of photos',
    type: PhotoDto,
    isArray: true,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto(
    @Query() findPhotoFilter: FindAllPhotoFilterDto,
  ): Promise<SignedPhotoDto[]> {
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

  @Post('/process')
  @ApiOperation({
    summary:
      'put process image request to queue inorder to generate watermark, thumbnail, exif images after upload',
  })
  @ApiResponse({
    status: HttpStatusCode.Accepted,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async processPhotos(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() processImagesRequest: ProcessImagesRequest,
    @Res() res: Response,
  ) {
    console.log(processImagesRequest);
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
