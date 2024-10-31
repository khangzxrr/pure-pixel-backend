import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { ReportDto } from '../dtos/report.dto';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportPathUpdateDto } from '../dtos/rest/report-patch-update.request.dto';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ReportPutUpdateRequestDto } from '../dtos/rest/report-put-update.request.dto';

@Controller('manager/report')
@ApiTags('manager-report')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.MANAGER_ROLE] })
export class ManagerReportController {
  constructor(@Inject() private readonly reportService: ReportService) {}

  @Get()
  @ApiOkResponsePaginated(ReportDto)
  async getReports(@Query() reportFindAllDto: ReportFindAllRequestDto) {
    return await this.reportService.findAll(reportFindAllDto);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async patchUpdateReport(
    @Param('id') id: string,
    @Body() reportPatchUpdateDto: ReportPathUpdateDto,
  ) {
    return await this.reportService.patchUpdate(id, reportPatchUpdateDto);
  }

  @Post()
  @ApiOkResponse({
    type: ReportDto,
  })
  async createReport(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() report: ReportCreateRequestDto,
  ) {
    return await this.reportService.create(user.sub, report);
  }

  @Delete(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async deleteReport(@Param('id') id: string) {
    return await this.reportService.delete(id);
  }

  @Put(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async putUpdateReport(
    @Param('id') id: string,
    @Body() updateDto: ReportPutUpdateRequestDto,
  ) {
    return await this.reportService.replace(id, updateDto);
  }
}
