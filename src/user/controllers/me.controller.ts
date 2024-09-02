import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  AuthenticatedUser,
  AuthGuard,
  RoleMatchingMode,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';

@Controller('me')
export class MeController {
  @Get()
  //because we registed guard as global, so we can also use @role only to check, authguard is default check
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: ['photographer'], mode: RoleMatchingMode.ALL })
  getMeInfo(
    @AuthenticatedUser()
    user: any,
  ) {
    return `hello world ${user.preferred_username}`;
  }
}
