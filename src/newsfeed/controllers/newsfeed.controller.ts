import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsfeedService } from '../services/newsfeed.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { NewsfeedDto } from '../dtos/newsfeed.dto';
import { NewsfeedFindAllDto } from '../dtos/rest/newsfeed-find-all.dto';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { NewsfeedCreateDto } from '../dtos/newsfeed.create.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';

@Controller('newsfeed')
@ApiTags('newsfeed')
export class NewsfeedController {
  constructor(@Inject() private readonly newsfeedService: NewsfeedService) {}

  @Get()
  @ApiOperation({
    summary: 'get all newsfeed',
  })
  @ApiOkResponsePaginated(NewsfeedDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async findAll(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: NewsfeedFindAllDto,
  ) {
    return await this.newsfeedService.findAll(user ? user.sub : '', findAllDto);
  }

  @Post()
  @ApiOperation({
    summary: 'create newsfeed',
  })
  @ApiOkResponse({
    type: NewsfeedDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async createNewsfeed(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() newsfeedCreateDto: NewsfeedCreateDto,
  ) {
    return await this.newsfeedService.create(user.sub, newsfeedCreateDto);
  }
}
