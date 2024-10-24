import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CameraService } from '../services/camera.service';
import { MakerDto } from '../dtos/maker.dto';
import { GetTopDto } from '../dtos/rest/get-top.dto';

@Controller('camera')
@ApiTags('camera')
export class CameraController {
  constructor(@Inject() private readonly cameraService: CameraService) {}

  @Get('/brand/:brandId/top')
  @ApiOperation({
    summary: 'get most popular camera of brand by brandId',
  })
  async getTopCameraOfBranch(
    @Param('brandId') brandId: string,
    @Query() getTopDto: GetTopDto,
  ) {
    return await this.cameraService.findTopCameraOfBrand(
      brandId,
      getTopDto.top,
    );
  }

  @Get('/brand/popular')
  @ApiOperation({
    summary: 'get most popular brands',
  })
  @ApiOkResponse({
    isArray: true,
    type: MakerDto,
  })
  async getTopBranch(@Query() getTopBrand: GetTopDto) {
    return await this.cameraService.findTopBrand(getTopBrand.top);
  }

  @Get('/popular-graph')
  @ApiOperation({
    summary: 'get most popular cameras graph',
  })
  async getPopularCameraGraphs() {
    return await this.cameraService.getPopularGraph();
  }
}
