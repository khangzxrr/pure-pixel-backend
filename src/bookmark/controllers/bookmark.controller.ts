import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookmarkService } from '../services/bookmark.service';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookmarkDto } from '../dtos/bookmark.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';

import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

@Controller('bookmark')
@ApiTags('bookmark')
@UseGuards(AuthGuard, KeycloakRoleGuard)
export class BookmarkController {
  constructor(@Inject() private readonly bookmarkService: BookmarkService) {}

  @Get('/photo')
  @ApiOperation({
    summary: 'find all bookmarked photos',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  async findAllBookmarkedPhoto() {}

  @Post(':photoId')
  @ApiOperation({
    summary: 'bookmark photo by photoId',
  })
  @ApiOkResponse({
    type: BookmarkDto,
  })
  async createBookmark(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
  ) {
    return await this.bookmarkService.create(user.sub, photoId);
  }

  @Delete(':photoId')
  @ApiOperation({
    summary: 'delete photo by photoId',
  })
  @ApiOkResponse({
    type: BookmarkDto,
  })
  async deleteBookmark(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
  ) {
    return await this.bookmarkService.delete(user.sub, photoId);
  }
}
