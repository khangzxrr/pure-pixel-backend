import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoService } from '../services/photo.service';
import { AuthGuard, Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoVoteRequestDto } from '../dtos/rest/photo-vote.request.dto';

@Controller('photo')
@ApiTags('photo-vote')
export class PhotoVoteController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Post(':id/vote')
  @ApiOperation({
    summary: 'upvote/downvote an photo',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async upvoteAnPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() voteRequestDto: PhotoVoteRequestDto,
  ) {
    return await this.photoService.vote(user.sub, id, voteRequestDto);
  }

  @Delete(':id/vote')
  @ApiOperation({
    summary: 'delete vote by photo id',
  })
  @ApiOkResponse({
    description: 'deleted',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async deletePhotoById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.deleteVote(user.sub, id);
  }
}
