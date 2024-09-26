import {
  Body,
  Controller,
  Delete,
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
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { PresignedUploadUrlResponse } from '../dtos/presigned-upload-url.response.dto';
import { PhotoDto, SignedPhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequest } from '../dtos/photo-update.request.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';

import { Response } from 'express';
import { ParsedUserDto } from 'src/user/dto/parsed-user.dto';
import { CommentService } from '../services/comment.service';
import { CreateCommentRequestDto } from '../dtos/create-comment.request.dto';
import { CommentEntity } from '../entities/comment.entity';
import { ProcessPhotosRequest } from '../dtos/process-images.request.dto';
import { GenerateWatermarkRequestDto } from '../dtos/generate-watermark.request.dto';
import { SharePhotoRequestDto } from '../dtos/share-photo.request.dto';

@Controller('photo')
@ApiTags('photo')
export class PhotoController {
  constructor(
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly commentService: CommentService,
  ) {}

  // @Get('/test/:key')
  // async test(@Param('key') key: string, @Res() res: Response) {
  //   const sharp = await this.photoProcessService.sharpInitFromObjectKey(key); // const thumbnail = await this.photoProcessService
  //   //   .makeThumbnail(sharp)
  //   //   .toBuffer();
  //   //
  //
  //   console.log(await this.photoProcessService.makeExif(sharp));
  //
  //   const watermark = await this.photoProcessService
  //     .makeWatermark(sharp, 'test')
  //     .then((s) => s.toBuffer());
  //
  //   res.set({
  //     'Content-Type': 'image/jpeg',
  //     'Content-Length': watermark.length,
  //   });
  //
  //   const stream = new Readable();
  //   stream.push(watermark);
  //   stream.push(null);
  //
  //   stream.pipe(res);
  // }
  //
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

  @Delete('/:id')
  @ApiOperation({
    summary: 'delete photo by id',
  })
  @ApiOkResponse({})
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async deletePhotoById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.deleteById(user.sub, id);
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
    return await this.photoService.updatePhotos(user.sub, body.photos);
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

  @Get('/:id/avaiable-resolution')
  @ApiOperation({
    summary: 'get photo available scaling resolution',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async getPhotoAvailableResolution(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.getAvailablePhotoResolution(user.sub, id);
  }

  //TODO: implement GET /share API
  @Get('/:id/share')
  @ApiOperation({
    summary: 'get shared info of photo by id',
  })
  @ApiOkResponse({
    status: HttpStatusCode.Ok,
    type: PhotoDto,
  })
  async getSharedInfo(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    throw new NotImplementedException();
  }

  //if public =>  share info = selected share photo info with quality
  //if private => share info = selected share photo but when GET /share will throw 401
  //if shared_link => share info = selected share photo with quality, GET /share return correct quality of image
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
  ) {}
}
