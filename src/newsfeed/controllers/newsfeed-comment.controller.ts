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
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsfeedCommentService } from '../services/newsfeed-comment.service';
import { AuthenticatedUser, AuthGuard, Public } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { NewsfeedCommentFindAllDto } from '../dtos/rest/newsfeed-comment-find-all.request.dto';

import { NewsfeedCommentCreateDto } from '../dtos/newsfeed-comment.create.dto';
import { NewsfeedCommentUpdateDto } from '../dtos/newsfeed-comment.update.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { NewsfeedCommentDto } from '../dtos/newsfeed-comment.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';

@Controller('newsfeed')
@ApiTags('newsfeed-comment')
export class NewsfeedCommentController {
  constructor(
    @Inject() private readonly newsfeedCommentService: NewsfeedCommentService,
  ) {}

  @Get(':newsfeedId/comment')
  @ApiOperation({
    summary: 'get all comment by newsfeedId',
  })
  @ApiOkResponsePaginated(NewsfeedCommentDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async findAll(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
    @Query() findallDto: NewsfeedCommentFindAllDto,
  ) {
    return await this.newsfeedCommentService.findMany(
      user ? user.sub : '',
      newsfeedId,
      findallDto,
    );
  }

  @Get(':newsfeedId/comment/:commentId/reply')
  @ApiOperation({
    summary: 'get all comments replies by newsfeedId and commentId',
  })
  @ApiOkResponsePaginated(NewsfeedCommentDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async findAllReplies(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
    @Param('commentId') commentId: string,
    @Query() findallDto: NewsfeedCommentFindAllDto,
  ) {
    return await this.newsfeedCommentService.findMany(
      user ? user.sub : '',
      newsfeedId,
      findallDto,
      commentId,
    );
  }

  @Post(':newsfeedId/comment')
  @ApiOperation({
    summary: 'create new comment by newsfeedId',
  })
  @ApiOkResponse({
    type: NewsfeedCommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async create(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
    @Body() createDto: NewsfeedCommentCreateDto,
  ) {
    return await this.newsfeedCommentService.create(
      user.sub,
      newsfeedId,
      createDto,
    );
  }

  @Post(':newsfeedId/comment/:commentId/reply')
  @ApiOperation({
    summary: 'create new comment reply by newsfeedId',
  })
  @ApiOkResponse({
    type: NewsfeedCommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async createReply(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
    @Param('commentId') commentId: string,
    @Body() createDto: NewsfeedCommentCreateDto,
  ) {
    return await this.newsfeedCommentService.reply(
      user.sub,
      newsfeedId,
      commentId,
      createDto,
    );
  }

  @Patch(':newsfeedId/comment/:commentId')
  @ApiOperation({
    summary: 'update comment by newsfeedId and commentId',
  })
  @ApiOkResponse({
    type: NewsfeedCommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async update(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
    @Param('commentId') commentId: string,
    @Body() updateDto: NewsfeedCommentUpdateDto,
  ) {
    return await this.newsfeedCommentService.update(
      user.sub,
      newsfeedId,
      commentId,
      updateDto,
    );
  }

  @Delete('newsfeedId/comment/:commentId')
  @ApiOperation({
    summary: 'delete comment by newsfeedId and commentId',
  })
  @ApiOkResponse({
    type: NewsfeedCommentDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async delete(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
    @Param('commentId') commentId: string,
  ) {
    return await this.newsfeedCommentService.delete(
      user.sub,
      newsfeedId,
      commentId,
    );
  }
}
