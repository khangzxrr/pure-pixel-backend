import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { User } from '@prisma/client';
import { UserService } from './services/user.service';

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
}
