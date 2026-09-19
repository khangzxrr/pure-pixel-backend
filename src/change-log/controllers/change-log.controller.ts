import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ChangeLogDto } from '../dtos/change-log.dto';
import { ChangeLogCreateRequestDto } from '../dtos/rest/change-log-create.request.dto';
import { ChangeLogFindAllRequestDto } from '../dtos/rest/change-log-find-all.request.dto';
import { ChangeLogPatchUpdateRequestDto } from '../dtos/rest/change-log-patch-update.request.dto';
import { ChangeLogService } from '../services/change-log.service';

@Controller('changelog')
@ApiTags('changelog')
export class ChangeLogController {
  constructor(private readonly changeLogService: ChangeLogService) {}

  @Get()
  @ApiOperation({
    summary: 'get published change log entries, newest first',
  })
  @ApiOkResponsePaginated(ChangeLogDto)
  @Public(true)
  async findPublished(@Query() findAllRequestDto: ChangeLogFindAllRequestDto) {
    return await this.changeLogService.findPublished(findAllRequestDto);
  }

  @Get('latest')
  @ApiOperation({
    summary: 'get the newest published entry, used for the "new" badge',
  })
  @ApiOkResponse({
    type: ChangeLogDto,
  })
  @Public(true)
  async findLatestPublished() {
    return await this.changeLogService.findLatestPublished();
  }

  @Get('manage')
  @ApiOperation({
    summary: 'get all change log entries including drafts',
  })
  @ApiOkResponsePaginated(ChangeLogDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE, Constants.ADMIN_ROLE] })
  async findAll(@Query() findAllRequestDto: ChangeLogFindAllRequestDto) {
    return await this.changeLogService.findAll(findAllRequestDto);
  }

  @Post()
  @ApiOperation({
    summary: 'create a change log entry',
  })
  @ApiOkResponse({
    type: ChangeLogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE, Constants.ADMIN_ROLE] })
  async create(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createRequestDto: ChangeLogCreateRequestDto,
  ) {
    return await this.changeLogService.create(user.sub, createRequestDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update a change log entry',
  })
  @ApiOkResponse({
    type: ChangeLogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE, Constants.ADMIN_ROLE] })
  async updateById(
    @Param('id') id: string,
    @Body() updateRequestDto: ChangeLogPatchUpdateRequestDto,
  ) {
    return await this.changeLogService.update(id, updateRequestDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'delete a change log entry',
  })
  @ApiOkResponse({
    description: 'deleted',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE, Constants.ADMIN_ROLE] })
  async deleteById(@Param('id') id: string) {
    return await this.changeLogService.delete(id);
  }
}
