import {
  Body,
  Controller,
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
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ReportService } from '../services/report.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ReportDto } from '../dtos/report.dto';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportPathUpdateDto } from '../dtos/rest/report-patch-update.request.dto';
import { ReportPutUpdateRequestDto } from '../dtos/rest/report-put-update.request.dto';
import { Constants } from 'src/infrastructure/utils/constants';

@Controller('user/report')
@ApiTags('user-report')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({
  roles: [Constants.CUSTOMER_ROLE, Constants.PHOTOGRAPHER_ROLE],
})
export class UserReportController {
  constructor(@Inject() private readonly reportService: ReportService) {}

  @Get()
  @ApiOkResponsePaginated(ReportDto)
  async getAllReportsOfUser(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() reportFindAllDto: ReportFindAllRequestDto,
  ) {
    return await this.reportService.findAllOfUser(user.sub, reportFindAllDto);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async patchUpdateReport(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() reportPatchUpdateDto: ReportPathUpdateDto,
  ) {
    return await this.reportService.patchUpdateOfUser(
      user.sub,
      id,
      reportPatchUpdateDto,
    );
  }

  @Post()
  @ApiOkResponse({
    type: ReportDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async createReport(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() report: ReportCreateRequestDto,
  ) {
    return await this.reportService.create(user.sub, report);
  }

  @Put(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async putUpdateReport(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() updateDto: ReportPutUpdateRequestDto,
  ) {
    return await this.reportService.replaceOfUser(user.sub, id, updateDto);
  }
}
