import {
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookmarkService } from '../services/bookmark.service';
import { AuthenticatedUser, AuthGuard } from 'src/authen/oidc';
import { RoleGuard } from 'src/authen/guards/role.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookmarkDto } from '../dtos/bookmark.dto';

@Controller('bookmark')
@ApiTags('bookmark')
@UseGuards(AuthGuard, RoleGuard)
export class BookmarkController {
  constructor(@Inject() private readonly bookmarkService: BookmarkService) {}

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
