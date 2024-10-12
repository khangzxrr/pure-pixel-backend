import { Injectable } from '@nestjs/common';
import { ReportRepository } from 'src/database/repositories/report.repository';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportDto } from '../dtos/report.dto';
import { ReportFindAllResponseDto } from '../dtos/rest/report-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async create(reportCreateRequestDto: ReportCreateRequestDto) {}

  async findAll(reportFindAllDto: ReportFindAllRequestDto) {
    const count = await this.reportRepository.count(reportFindAllDto.toWhere());
    const reports = await this.reportRepository.findAll(
      reportFindAllDto.limit,
      reportFindAllDto.toSkip(),
      reportFindAllDto.toWhere(),
      reportFindAllDto.toOrderBy(),
    );

    const reportDtos = plainToInstance(ReportDto, reports);

    return new ReportFindAllResponseDto(
      reportFindAllDto.limit,
      count,
      reportDtos,
    );
  }
}
