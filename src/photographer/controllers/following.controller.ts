import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { FollowingService } from '../services/following.service';
import { FindAllFollowRequestDto } from '../dtos/find-all-following-dtos/find-all-following.request.dto';
import { FollowDto } from '../dtos/following-dto';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

@Controller('follow')
@ApiTags('follow')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
export class FollowingController {
  constructor(@Inject() private readonly followingService: FollowingService) {}

  @Get('following/:userId')
  @ApiOperation({
    summary:
      'check if current logged user is following specificated user by userId',
  })
  @ApiOkResponse({
    type: FollowDto,
  })
  async checkFollow(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.followingService.get(user.sub, userId);
  }

  @Delete('following/:userId')
  @ApiOperation({
    summary: 'unfollow user by userId',
  })
  @ApiOkResponse({
    type: FollowDto,
  })
  async unfollow(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.followingService.unfollow(user.sub, userId);
  }

  @Post('/following/:userId')
  @ApiOperation({
    summary: 'follow user by userId',
  })
  @ApiOkResponse({
    type: FollowDto,
  })
  async follow(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.followingService.follow(user.sub, userId);
  }

  @Get('follower')
  @ApiOperation({
    summary: 'get all users who follow me',
  })
  @ApiOkResponsePaginated(FollowDto)
  async findallFollower(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: FindAllFollowRequestDto,
  ) {
    return await this.followingService.getAllFollowerOfUserId(
      user.sub,
      findAllDto,
    );
  }

  @Get('following')
  @ApiOperation({
    summary: 'get all users who followed by me',
  })
  @ApiOkResponsePaginated(FollowDto)
  async findAllFollowing(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: FindAllFollowRequestDto,
  ) {
    return await this.followingService.getAllFollowedByUserId(
      user.sub,
      findAllDto,
    );
  }
}
