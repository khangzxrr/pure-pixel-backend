import { Controller, Get, UseGuards, UseInterceptors, Request, Session } from '@nestjs/common';
import { AppService } from './app.service';
import { User } from '@prisma/client';
import { UserService } from './services/user.service';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { AuthGuard } from './auth/auth.guard';
import { Record } from '@prisma/client/runtime/library';
import { SessionRequest } from 'supertokens-node/framework/express';
import supertokens from "supertokens-node";
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users')
  getAllUsers(): Promise<User[]> {
    return this.userService.users({});
  }

  @Get('/user/info')
  @UseGuards(new AuthGuard())
  async getUserInfo(@Request() req: SessionRequest, @Session() session: SessionContainer)
    : Promise<Record<string, unknown>> {

    let userId = session.getUserId();

    let userInfo = supertokens.getUser(userId);


    return userInfo
  }


  @Get('/test')
  @UseGuards(new AuthGuard())
  getSessionInfo(
    @Session() session: SessionContainer,
  ): Record<string, unknown> {
    return {
      sessionHandle: session.getHandle(),
      userId: session.getUserId(),
      accessTokenPayload: session.getAccessTokenPayload(),
    };
  }
}
