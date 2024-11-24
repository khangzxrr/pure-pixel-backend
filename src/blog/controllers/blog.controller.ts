import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { FormDataRequest } from 'nestjs-form-data';

@Controller('blog')
@ApiTags('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({
    summary: 'get many blogs',
  })
  @ApiOkResponsePaginated(BlogDto)
  @Public(true)
  async findAll(@Query() findAllRequestDto: BlogFindAllRequestDto) {
    return await this.blogService.findAll(findAllRequestDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'get specific blog by blogId',
  })
  @ApiOkResponse({
    type: BlogDto,
  })
  @Public(true)
  async getById(@Param('id') id: string) {
    return await this.blogService.findById(id);
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'deleted',
  })
  @ApiOperation({
    summary: 'delete a specific blog by blogId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async deleteById(@Param('id') id: string) {
    return await this.blogService.delete(id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'create a new blog',
  })
  @ApiOkResponse({
    type: BlogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  @FormDataRequest()
  async createBlog(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() blog: BlogCreateRequestDto,
  ) {
    return await this.blogService.create(user.sub, blog);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    type: BlogDto,
  })
  @ApiOperation({
    summary: 'update blog info by blogId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  @FormDataRequest()
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
  @ApiOperation({
    summary: 'replace blog info by blogId',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  @FormDataRequest()
  async putUpdateById(
    @Param('id') id: string,
    @Body() blogPutUpdateDto: BlogPutUpdateRequestDto,
  ) {
    return await this.blogService.replace(id, blogPutUpdateDto);
  }
}
