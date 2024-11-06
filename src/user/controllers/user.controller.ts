import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';

@Controller('user')
@ApiTags('manage-user')
export class UserController {
  constructor(@Inject() private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'get user from id',
  })
  async getUserById(@Param('id') id: string) {
    return this.userService.findOne({
      id,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'get all users',
  })
  async getAllUsers() {}
}
