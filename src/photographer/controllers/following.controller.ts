import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { FollowingService } from '../services/following.service';
import { FindAllFollowingRequestDto } from '../dtos/find-all-following-dtos/find-all-following.request.dto';
import { FollowingDto } from '../dtos/following-dto';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

@Controller('following')
@ApiTags('following')
export class FollowingController {
  constructor(@Inject() private readonly followingService: FollowingService) {}
  @Get('')
  @ApiOperation({
    summary: 'get all photographers. Ah yes I KNOW! doesnt have filter yet',
  })
  @ApiOkResponsePaginated(FollowingDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async findAllAvailablePhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllFollowingRequestDto: FindAllFollowingRequestDto,
  ) {
    return this.followingService.getPhotographerWithFollow(
      user.sub,
      findAllFollowingRequestDto,
    );
  }
}
