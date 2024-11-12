import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ManagePhotoService } from '../services/manage-photo.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { HttpStatusCode } from 'axios';
import { PhotoDto } from '../dtos/photo.dto';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';

@Controller('manager/photo')
@ApiTags('manager-manage-photo')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.ADMIN_ROLE, Constants.MANAGER_ROLE] })
export class ManagePhotoController {
  constructor(
    @Inject() private readonly managePhotoService: ManagePhotoService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'find all photos',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  async findAllPhotos(@Query() findAllDto: FindAllPhotoFilterDto) {
    return await this.managePhotoService.findAll(findAllDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update one or more fields of photos',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    isArray: true,
    type: PhotoDto,
  })
  async updatePhoto(
    @Param('id') id: string,
    @Body() photoUpdateDto: PhotoUpdateRequestDto,
  ) {
    return await this.managePhotoService.update(id, photoUpdateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'delete a photo by id',
  })
  async deletePhoto(@Param('id') id: string) {
    return await this.managePhotoService.delete(id);
  }
}
