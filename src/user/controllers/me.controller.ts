import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UserService } from '../services/user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('me')
@ApiTags('user')
export class MeController {
  constructor(@Inject() private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'get customer info',
  })
  @Get()
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeInfo(
    @AuthenticatedUser()
    user: any,
  ) {
    return await this.userService.getByUserId(user.sub);
  }
}
