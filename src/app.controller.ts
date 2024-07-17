import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { User } from '@prisma/client';
import { UserService } from './services/user.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
@UseInterceptors(CacheInterceptor)
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
}
