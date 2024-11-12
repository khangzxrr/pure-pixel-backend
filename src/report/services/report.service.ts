import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ReportRepository } from 'src/database/repositories/report.repository';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportDto } from '../dtos/report.dto';
import { ReportFindAllResponseDto } from '../dtos/rest/report-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';
import { ReportPathUpdateDto } from '../dtos/rest/report-patch-update.request.dto';
import { ReportNotFoundException } from '../exceptions/report-not-found.exception';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { CommentRepository } from 'src/database/repositories/comment.repository';
import { ReferenceIdNotFoundException } from '../exceptions/referenced-id-is-not-found.exception';
import { ReportType } from '@prisma/client';
import { ReportPutUpdateRequestDto } from '../dtos/rest/report-put-update.request.dto';

import { PhotoService } from 'src/photo/services/photo.service';

import { CommentDto } from 'src/photo/dtos/comment-dto';
import { NotBelongReportException } from '../exceptions/not-belong-report.exception';
import { UserReportPathUpdateDto } from '../dtos/rest/user-report-patch-update.request.dto';
import { UserReportPutUpdateRequestDto } from '../dtos/rest/user-report-put-update.request.dto';
import { UserDto } from 'src/user/dtos/user.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingDto } from 'src/booking/dtos/booking.dto';

@Injectable()
export class ReportService {
  constructor(
    @Inject() private readonly reportRepository: ReportRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly commentRepository: CommentRepository,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly bookingRepository: BookingRepository,
  ) {}

  async validateReferenceId(reportType: ReportType, referenceId: string) {
    let obj: object = null;

    switch (reportType) {
      case 'USER':
        obj = await this.userRepository.findUniqueOrThrow(referenceId);
        break;
      case 'PHOTO':
        obj = await this.photoRepository.findUniqueOrThrow(referenceId);
        break;

      case 'BOOKING':
        throw new NotImplementedException();

      case 'COMMENT':
        obj = await this.commentRepository.findUniqueOrThrow({
          id: referenceId,
        });
        break;
    }

    if (!obj) {
      throw new ReferenceIdNotFoundException();
    }
  }

  async delete(id: string) {
    const report = await this.reportRepository.findUniqueOrThrow(id);

    if (!report) {
      throw new ReportNotFoundException();
    }

    const deletedReport = await this.reportRepository.delete(id);

    return plainToInstance(ReportDto, deletedReport);
  }

  async replace(id: string, reportPutUpdateDto: ReportPutUpdateRequestDto) {
    const report = await this.reportRepository.findUniqueOrThrow(id);

    if (!report) {
      throw new ReportNotFoundException();
    }

    await this.validateReferenceId(
      reportPutUpdateDto.reportType,
      reportPutUpdateDto.referenceId,
    );

    const replacedReport = await this.reportRepository.updateById(
      id,
      reportPutUpdateDto,
    );

    return plainToInstance(ReportDto, replacedReport);
  }

  async create(userId: string, reportCreateRequestDto: ReportCreateRequestDto) {
    await this.validateReferenceId(
      reportCreateRequestDto.reportType,
      reportCreateRequestDto.referenceId,
    );

    const report = await this.reportRepository.create({
      user: {
        connect: {
          id: userId,
        },
      },
      content: reportCreateRequestDto.content,
      archived: false,
      reportType: reportCreateRequestDto.reportType,
      referenceId: reportCreateRequestDto.referenceId,
      reportStatus: 'OPEN',
    });

    return plainToInstance(ReportDto, report);
  }

  async patchUpdate(id: string, reportUpdateDto: ReportPathUpdateDto) {
    const report = await this.reportRepository.findUniqueOrThrow(id);

    if (!report) {
      throw new ReportNotFoundException();
    }

    if (reportUpdateDto.referenceId) {
      await this.validateReferenceId(
        reportUpdateDto.reportType
          ? reportUpdateDto.reportType
          : report.reportType,
        reportUpdateDto.referenceId,
      );
    }

    const updatedReport = await this.reportRepository.updateById(
      id,
      reportUpdateDto,
    );

    return plainToInstance(ReportDto, updatedReport);
  }

  async findAll(reportFindAllDto: ReportFindAllRequestDto) {
    const count = await this.reportRepository.count(reportFindAllDto.toWhere());
    const reports = await this.reportRepository.findAll(
      reportFindAllDto.limit,
      reportFindAllDto.toSkip(),
      reportFindAllDto.toWhere(),
      reportFindAllDto.toOrderBy(),
    );

    const reportDtos = plainToInstance(ReportDto, reports);

    const reportWithReferenceEntityPromises = reportDtos.map(async (r) => {
      try {
        switch (r.reportType) {
          case 'USER':
            const user = await this.userRepository.findUnique(
              r.referenceId,
              {},
            );
            r.referencedUser = plainToInstance(UserDto, user);
            break;
          case 'PHOTO':
            const photo = await this.photoService.findById(
              '',
              r.referenceId,
              false,
            );

            r.referencedPhoto = photo;
            break;
          case 'COMMENT':
            const comment = await this.commentRepository.findUniqueOrThrow({
              id: r.referenceId,
            });
            r.referencedComment = plainToInstance(CommentDto, comment);
            break;
          case 'BOOKING':
            const booking = await this.bookingRepository.findUniqueOrThrow({
              id: r.referenceId,
            });
            r.referencedBooking = plainToInstance(BookingDto, booking);

          default:
            break;
        }
      } catch (e) {
        return null;
      }

      return r;
    });

    const reportWithEntities = await Promise.all(
      reportWithReferenceEntityPromises,
    );

    const notNullReports = reportWithEntities.filter((v) => v !== null);

    return new ReportFindAllResponseDto(
      reportFindAllDto.limit,
      count,
      notNullReports,
    );
  }

  async findAllOfUser(
    userId: string,
    reportFindAllDto: ReportFindAllRequestDto,
  ) {
    reportFindAllDto.userId = userId;

    return await this.findAll(reportFindAllDto);
  }

  async patchUpdateOfUser(
    userId: string,
    id: string,
    reportPatchUpdateDto: UserReportPathUpdateDto,
  ) {
    const report = await this.reportRepository.findUniqueOrThrow(id);

    if (report.userId !== userId) {
      throw new NotBelongReportException();
    }

    const updateDto = plainToInstance(
      ReportPathUpdateDto,
      reportPatchUpdateDto,
    );

    return await this.patchUpdate(id, updateDto);
  }

  async replaceOfUser(
    userId: string,
    id: string,
    updateDto: UserReportPutUpdateRequestDto,
  ) {
    const report = await this.reportRepository.findUniqueOrThrow(id);

    if (report.userId !== userId) {
      throw new NotBelongReportException();
    }

    const replaceDto = plainToInstance(ReportPutUpdateRequestDto, updateDto);

    return await this.replace(id, replaceDto);
  }
}
