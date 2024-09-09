import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpgradeService } from '../services/upgrade.service';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { HttpStatusCode } from 'axios';

@Controller('upgrade')
@ApiTags('upgrade')
export class UpgradeController {
  constructor(@Inject() private readonly upgradeService: UpgradeService) {}

  @Get()
  @ApiOperation({
    summary: 'get all avaiable upgrade packages',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: UpgradePackageDto,
    isArray: true,
  })
  async findAll(): Promise<UpgradePackageDto[]> {
    return await this.upgradeService.findAll();
  }
}
