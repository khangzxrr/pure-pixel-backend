import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NewsfeedLikeService } from '../services/newsfeed-like.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';

@Controller('newsfeed')
@ApiTags('newsfeed-like')
@UseGuards(AuthGuard, KeycloakRoleGuard)
export class NewsfeedLikeController {
  constructor(
    @Inject() private readonly newsfeedLikeService: NewsfeedLikeService,
  ) {}

  @Get(':newsfeedId/like/me')
  @ApiOperation({
    summary: 'check if user liked newsfeed by newsfeedId',
  })
  async findUnique(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
  ) {
    return await this.newsfeedLikeService.findUnique(user.sub, newsfeedId);
  }

  @Post(':newsfeedId/like')
  @ApiOperation({
    summary: 'like a newsfeed by newsfeedId',
  })
  async create(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
  ) {
    return await this.newsfeedLikeService.upsert(user.sub, newsfeedId);
  }

  @Delete(':newsfeedId/like')
  @ApiOperation({
    summary: 'delete a newsfeed like by newsfeedId',
  })
  async delete(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('newsfeedId') newsfeedId: string,
  ) {
    return await this.newsfeedLikeService.delete(user.sub, newsfeedId);
  }
}
