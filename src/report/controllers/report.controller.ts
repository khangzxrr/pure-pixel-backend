import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { ReportDto } from '../dtos/report.dto';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportPathUpdateDto } from '../dtos/rest/report-patch-update.request.dto';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';

@Controller('report')
@ApiTags('report')
export class ReportController {
  constructor(@Inject() private readonly reportService: ReportService) {}

  @Get()
  @ApiOkResponsePaginated(ReportDto)
  async getReports(@Param() reportFindAllDto: ReportFindAllRequestDto) {
    return await this.reportService.findAll(reportFindAllDto);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async patchUpdateReport(
    @Param('id') id: string,
    @Body() reportPatchUpdateDto: ReportPathUpdateDto,
  ) {}

  @Post()
  @ApiOkResponse({
    type: ReportDto,
  })
  async createReport(@Body() report: ReportCreateRequestDto) {}

  @Delete(':id')
  @ApiOkResponse({
    type: ReportDto,
  })
  async deleteReport(@Param('id') id: string) {}
}
