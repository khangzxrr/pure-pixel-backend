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
import { CommentService } from '../services/comment.service';
import { CreateCommentRequestDto } from '../dtos/rest/create-comment.request.dto';
import { CommentEntity } from '../entities/comment.entity';
import { GenerateWatermarkRequestDto } from '../dtos/rest/generate-watermark.request.dto';
import { SharePhotoRequestDto } from '../dtos/rest/share-photo.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ResolutionDto } from '../dtos/resolution.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { FormDataRequest } from 'nestjs-form-data';

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
