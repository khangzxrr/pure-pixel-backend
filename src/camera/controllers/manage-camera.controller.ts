import {
  Body,
  Controller,
  Delete,
  // Delete,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CameraService } from '../services/camera.service';
import { CameraDto } from '../dtos/camera.dto';
import { UpdateCameraDto } from '../dtos/rest/update-camera.dto';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { FormDataRequest } from 'nestjs-form-data';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { FindAllCameraDto } from '../dtos/rest/find-all-camera.dto';

@Controller('manager/camera')
@ApiTags('manager-manage-camera')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.ADMIN_ROLE, Constants.MANAGER_ROLE] })
export class ManageCameraController {
  constructor(@Inject() private readonly cameraService: CameraService) {}

  @Get()
  @ApiOkResponsePaginated(CameraDto)
  async findAll(@Query() findAllDto: FindAllCameraDto) {
    return await this.cameraService.findAll(findAllDto);
  }

  @Patch(':cameraId')
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    type: CameraDto,
  })
  @FormDataRequest()
  async updateCamera(
    @Param('cameraId') id: string,
    @Body() updateDto: UpdateCameraDto,
  ) {
    return await this.cameraService.update(id, updateDto);
  }

  @Delete(':cameraId')
  async deleteCamera(@Param('cameraId') id: string) {
    return await this.cameraService.delete(id);
  }
}
