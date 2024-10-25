import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Public, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CreateCommentRequestDto } from '../dtos/rest/create-comment.request.dto';
import { CommentService } from '../services/comment.service';

import { CommentDto } from '../dtos/comment-dto';

@Controller('comment')
@ApiTags('comment')
export class PhotoCommentController {
  constructor(@Inject() private readonly commentService: CommentService) {}

  @Get('/photo/:id')
  @ApiOperation({
    summary: 'get comments of photo',
  })
  @ApiOkResponse({
    type: CommentDto,
    isArray: true,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getComments(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ): Promise<CommentDto[]> {
    return await this.commentService.findAllByPhotoId(id, user ? user.sub : '');
  }

  @Get('/photo/:photoId/comment/:commentId')
  @ApiOperation({
    summary: 'get reply of a comment by commentId',
  })
  @ApiOkResponse({
    isArray: true,
    type: CommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getCommentReply(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
    @Param('commentId') commentId: string,
  ) {
    return await this.commentService.findAllReplies(
      photoId,
      user ? user.sub : '',
      commentId,
    );
  }

  @Post('/photo/:photoId/comment/:commentId/reply')
  @ApiOperation({
    summary: 'create a reply to comment',
  })
  @ApiOkResponse({
    type: CommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async createReply(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
    @Param('commentId') commentId: string,

    @Body() createCommentRequestDto: CreateCommentRequestDto,
  ) {
    return await this.commentService.createReply(
      photoId,
      user.sub,
      commentId,
      createCommentRequestDto,
    );
  }

  @Post('/photo/:id')
  @ApiOperation({
    summary: 'create a comment to photo',
  })
  @ApiOkResponse({
    type: CommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async createComment(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() createCommentRequestDto: CreateCommentRequestDto,
  ): Promise<CommentDto> {
    return await this.commentService.createComment(
      id,
      user.sub,
      createCommentRequestDto,
    );
  }
}
