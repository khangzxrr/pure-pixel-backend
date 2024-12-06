import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { UserDto } from '../dtos/user.dto';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ParsedUserDto } from '../dtos/parsed-user.dto';

@Controller('user')
@ApiTags('admin-manage-user')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.ADMIN_ROLE, Constants.MANAGER_ROLE] })
export class UserController {
  constructor(@Inject() private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'get user from id',
  })
  async getUserById(@Param('id') id: string) {
    return await this.userService.findOne({
      id,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'get all users',
  })
  @ApiOkResponsePaginated(UserDto)
  async getAllUsers(@Query() findallDto: UserFindAllRequestDto) {
    return await this.userService.findMany(findallDto);
  }

  @Post()
  @ApiOperation({
    summary: 'create new user',
  })
  @ApiOkResponse({
    type: UserDto,
  })
  async createNewUser(@Body() createDto: CreateUserDto) {
    return await this.userService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update user using id',
  })
  async patchUpdateUsers(
    @Param('id') userId: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateDto);
  }

  @Post(':id/ban')
  @ApiOperation({
    summary: 'ban user by id of user',
  })
  async banUser(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.userService.ban(user.sub, id);
  }

  @Post(':id/unban')
  @ApiOperation({
    summary: 'unban user by id of user',
  })
  async unbanUser(@Param('id') id: string) {
    return await this.userService.unban(id);
  }
}
