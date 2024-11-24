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
export class FollowingController {
  constructor(@Inject() private readonly followingService: FollowingService) {}

  @Get('/me/following/:userId')
  @ApiOperation({
    summary:
      'check if current logged user is following specificated user by userId',
  })
  @ApiOkResponse({
    type: FollowDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async checkFollow(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.followingService.get(user.sub, userId);
  }

  @Delete('/me/following/:userId')
  @ApiOperation({
    summary: 'unfollow user by userId',
  })
  @ApiOkResponse({
    type: FollowDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async unfollow(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.followingService.unfollow(user.sub, userId);
  }

  @Get('me/follower')
  @ApiOperation({
    summary: 'get all users who follow me',
  })
  @ApiOkResponsePaginated(FollowDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async findallFollower(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: FindAllFollowRequestDto,
  ) {
    return await this.followingService.getAllFollowerOfUserId(
      user.sub,
      findAllDto,
    );
  }

  @Post('me/following/:userId')
  @ApiOperation({
    summary: 'follow user by userId',
  })
  @ApiOkResponse({
    type: FollowDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async follow(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.followingService.follow(user.sub, userId);
  }

  @Get('me/following')
  @ApiOperation({
    summary: 'get all users who followed by me',
  })
  @ApiOkResponsePaginated(FollowDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async findAllFollowing(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: FindAllFollowRequestDto,
  ) {
    return await this.followingService.getAllFollowedByUserId(
      user.sub,
      findAllDto,
    );
  }

  @Get('follower/:userId')
  @ApiOperation({
    summary: 'get all users who follow specificated user by userId',
  })
  @ApiOkResponsePaginated(FollowDto)
  async findallFollowerOfUserId(
    @Param('userId') userId: string,
    @Query() findAllDto: FindAllFollowRequestDto,
  ) {
    return await this.followingService.getAllFollowerOfUserId(
      userId,
      findAllDto,
    );
  }

  @Get('following/:userId')
  @ApiOperation({
    summary: 'get all users who followed by specificated user using userId',
  })
  @ApiOkResponsePaginated(FollowDto)
  async findAllFollowingOfUserId(
    @Param('userId') userId: string,
    @Query() findAllDto: FindAllFollowRequestDto,
  ) {
    return await this.followingService.getAllFollowedByUserId(
      userId,
      findAllDto,
    );
  }
}
