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
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { UserDto } from '../dtos/user.dto';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { CreateUserDto } from '../dtos/create-user.dto';
import { FormDataRequest } from 'nestjs-form-data';

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
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  async createNewUser(@Body() createDto: CreateUserDto) {
    return await this.userService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update user using id',
  })
  async patchUpdateUsers() {}
}
