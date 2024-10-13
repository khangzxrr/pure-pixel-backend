import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogService } from '../services/blog.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { BlogDto } from '../dtos/blog.dto';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogPatchUpdateRequestDto } from '../dtos/rest/blog-patch-update.request.dto';
import { BlogPutUpdateRequestDto } from '../dtos/rest/blog-put-update.request.dto';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

@Controller('blog')
@ApiTags('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOkResponsePaginated(BlogDto)
  @Public(true)
  async findAll(@Query() findAllRequestDto: BlogFindAllRequestDto) {
    return await this.blogService.findAll(findAllRequestDto);
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'deleted',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async deleteById(@Param('id') id: string) {
    return await this.blogService.delete(id);
  }

  @Post()
  @ApiOkResponse({
    type: BlogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async createBlog(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() blog: BlogCreateRequestDto,
  ) {
    return await this.blogService.create(user.sub, blog);
  }

  @Post(':id/thumbnail')
  @ApiOkResponse({
    type: BlogDto,
  })
  @ApiOperation({
    summary: 'create presigned upload thumbnail URL for blog by id',
  })
  async createPresignedThumbnailPutUrl(@Param('id') id: string) {
    return this.blogService.createPresignedUploadThumbnail(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: BlogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async updateById(
    @Param('id') id: string,
    @Body() blogUpdateRequestDto: BlogPatchUpdateRequestDto,
  ) {
    return await this.blogService.update(id, blogUpdateRequestDto);
  }

  @Put(':id')
  @ApiOkResponse({
    type: BlogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async putUpdateById(
    @Param('id') id: string,
    @Body() blogPutUpdateDto: BlogPutUpdateRequestDto,
  ) {
    return await this.blogService.update(id, blogPutUpdateDto);
  }
}
