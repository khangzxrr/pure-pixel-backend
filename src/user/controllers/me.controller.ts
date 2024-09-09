import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UserService } from '../services/user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserFilterDto } from '../dto/user-filter.dto';

@Controller('me')
@ApiTags('user')
export class MeController {
  constructor(@Inject() private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'get user info',
  })
  @Get()
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeInfo(
    @AuthenticatedUser()
    user: any,
    @Query() userFilterDto: UserFilterDto,
  ) {
    console.log(userFilterDto);

    userFilterDto.id = user.sub;

    return await this.userService.findOne(userFilterDto);
  }
}
