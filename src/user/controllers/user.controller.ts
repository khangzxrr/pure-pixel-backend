import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';

@Controller('user')
@ApiTags('manager-user')
export class UserController {
  constructor(@Inject() private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'get user from id',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async getUserById(@Param('id') id: string) {
    return this.userService.findOne({
      id,
      followers: true,
      followings: true,
    });
  }
}
