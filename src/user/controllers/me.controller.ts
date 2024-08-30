import { Controller, Get } from '@nestjs/common';
import {
  AuthenticatedUser,
  RoleMatchingMode,
  Roles,
} from 'nest-keycloak-connect';

@Controller('me')
export class MeController {
  @Get()
  //because we registed guard as global, so we can also use @role only to check, authguard is default check
  //@UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: ['photographer'], mode: RoleMatchingMode.ALL })
  getMeInfo(
    @AuthenticatedUser()
    user: any,
  ) {
    return `hello world ${user.preferred_username}`;
  }
}
