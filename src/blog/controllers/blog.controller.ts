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
  UseInterceptors,
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
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('thumbnailFile'))
  @ApiOkResponse({
    type: BlogDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async createBlog(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() blog: BlogCreateRequestDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|PNG|JPG|JPEG)' }),
        ],
      }),
    )
    thumbnailFile: Express.Multer.File,
  ) {
    return await this.blogService.create(user.sub, blog, thumbnailFile);
  }

  @Patch(':id/thumbnail')
  @ApiOkResponse({
    type: BlogDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'update blog thumbnail by blogId',
  })
  @UseInterceptors(FileInterceptor('thumbnailFile'))
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async updateThumbnail(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|PNG|JPG|JPEG)' }),
        ],
      }),
    )
    thumbnailFile: Express.Multer.File,
  ) {
    return await this.blogService.updateThumbnail(id, thumbnailFile);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: BlogDto,
  })
  @ApiOperation({
    summary: 'update blog info by blogId',
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
  @ApiOperation({
    summary: 'replace blog info by blogId',
  })
  @UseInterceptors(FileInterceptor('thumbnailFile'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async putUpdateById(
    @Param('id') id: string,
    @Body() blogPutUpdateDto: BlogPutUpdateRequestDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|PNG|JPG|JPEG)' }),
        ],
      }),
    )
    thumbnailFile: Express.Multer.File,
  ) {
    return await this.blogService.replace(id, blogPutUpdateDto, thumbnailFile);
  }
}
