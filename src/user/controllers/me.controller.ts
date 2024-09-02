import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UserService } from '../services/user.service';

@Controller('me')
export class MeController {
  constructor(@Inject() private readonly userService: UserService) {}
  @Get()

  //because we registed guard as global, so we can also use @role only to check, authguard is default check
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeInfo(
    @AuthenticatedUser()
    user: any,
  ) {
    return await this.userService.getByUserId(user.sub);
  }
}
