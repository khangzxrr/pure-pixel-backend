import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CameraService } from '../services/camera.service';
import { MakerDto } from '../dtos/maker.dto';
import { GetTopBranchDto } from '../dtos/rest/get-top-brand.dto';

@Controller('camera')
@ApiTags('camera')
export class CameraController {
  constructor(@Inject() private readonly cameraService: CameraService) {}

  @Get('/brand/top')
  @ApiOperation({
    summary: 'get most popular brands',
  })
  @ApiOkResponse({
    isArray: true,
    type: MakerDto,
  })
  async getTopBranch(@Query() getTopBrand: GetTopBranchDto) {
    return await this.cameraService.findTopBrand(getTopBrand.top);
  }
}
