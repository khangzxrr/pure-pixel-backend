import { Controller, Get } from '@nestjs/common';
import { AuthenticatedUser, Public, Roles } from 'nest-keycloak-connect';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Public(true)
  getHello(): string {
    return 'Hello world';
  }

  @Get('private')
  getPrivate(
    @AuthenticatedUser()
    user: any,
  ): string {
    return `Authenticated only! ${user.preferred_username}`;
  }

  @Get('photographer')
  @Roles({
    roles: ['photographer'],
  })
  getAdmin(): string {
    return 'Photographer only!';
  }
}
