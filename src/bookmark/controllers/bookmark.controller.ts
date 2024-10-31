import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { BookmarkService } from '../services/bookmark.service';
import { AuthGuard, Public } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

@Controller('bookmark')
@ApiTags('bookmark')
@UseGuards(AuthGuard, KeycloakRoleGuard)
export class BookmarkController {
  constructor(@Inject() private readonly bookmarkService: BookmarkService) {}

  @Get()
  @ApiOperation({
    summary: 'get all bookmarked photo',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  async getAllBookmarkedPhoto() {}
}
