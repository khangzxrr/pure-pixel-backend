import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { UserDto } from '../dtos/user.dto';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';

@Controller('user')
@ApiTags('admin-manage-user')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.ADMIN_ROLE] })
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
}
