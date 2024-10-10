import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { UpgradePackageFindAllDto } from '../dtos/rest/upgrade-package-find-all.request.dto';
import { UpgradePackageService } from '../services/upgrade-package.service';

@Controller('upgrade-package')
@ApiTags('upgrade-package')
export class UpgradePackageController {
  constructor(
    @Inject() private readonly upgradePackageService: UpgradePackageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get all avaiable upgrade packages',
  })
  @ApiOkResponsePaginated(UpgradePackageDto)
  async findAll(@Query() findAllDto: UpgradePackageFindAllDto) {
    return await this.upgradePackageService.findAll(findAllDto);
  }
}
