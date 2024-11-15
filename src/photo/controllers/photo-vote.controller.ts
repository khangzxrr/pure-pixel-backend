import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoVoteRequestDto } from '../dtos/rest/photo-vote.request.dto';
import { PhotoVoteService } from '../services/photo-vote.service';

@Controller('photo')
@ApiTags('photo-vote')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
export class PhotoVoteController {
  constructor(@Inject() private readonly photoVoteService: PhotoVoteService) {}

  @Post(':photoId/vote')
  @ApiOperation({
    summary: 'upvote/downvote an photo',
  })
  async upvoteAnPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
    @Body() voteRequestDto: PhotoVoteRequestDto,
  ) {
    return await this.photoVoteService.vote(user.sub, id, voteRequestDto);
  }

  @Get(':photoId/vote')
  @ApiOperation({
    summary: 'check if user voted by photoId',
  })
  async checkVote(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
  ) {
    return await this.photoVoteService.getVote(user.sub, photoId);
  }

  @Delete(':photoId/vote')
  @ApiOperation({
    summary: 'delete vote by photo id',
  })
  @ApiOkResponse({
    description: 'deleted',
  })
  async deletePhotoById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
  ) {
    return await this.photoVoteService.deleteVote(user.sub, photoId);
  }
}
