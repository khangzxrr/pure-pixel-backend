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
import { PhotoDto } from 'src/photo/dtos/photo.dto';
import { CommentEntity } from 'src/photo/entities/comment.entity';
import { Constants } from 'src/infrastructure/utils/constants';
import { PhotoService } from 'src/photo/services/photo.service';
import { UserDto } from 'src/user/dtos/me.dto';

@Injectable()
export class ReportService {
  constructor(
    @Inject() private readonly reportRepository: ReportRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly commentRepository: CommentRepository,
    @Inject() private readonly photoService: PhotoService,
  ) {}

  async validateReferenceId(reportType: ReportType, referenceId: string) {
    let obj: object = null;

    switch (reportType) {
      case 'USER':
        obj = await this.userRepository.findOneById(referenceId);
        break;
      case 'PHOTO':
        obj = await this.photoRepository.getPhotoById(referenceId);
        break;

      case 'BOOKING':
        throw new NotImplementedException();

      case 'COMMENT':
        obj = await this.commentRepository.findById(referenceId);
        break;
    }

    if (!obj) {
      throw new ReferenceIdNotFoundException();
    }
  }

  async delete(id: string) {
    const report = await this.reportRepository.findById(id);

    if (!report) {
      throw new ReportNotFoundException();
    }

    const deletedReport = await this.reportRepository.delete(id);

    return plainToInstance(ReportDto, deletedReport);
  }

  async replace(
    id: string,
    userId: string,
    reportPutUpdateDto: ReportPutUpdateRequestDto,
  ) {
    const report = await this.reportRepository.findById(id);

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

    console.log(reportCreateRequestDto);

    const report = await this.reportRepository.create(
      userId,
      reportCreateRequestDto.content,
      reportCreateRequestDto.reportType,
      reportCreateRequestDto.reportStatus,
      reportCreateRequestDto.referenceId,
    );

    return plainToInstance(ReportDto, report);
  }

  async patchUpdate(id: string, reportUpdateDto: ReportPathUpdateDto) {
    const report = await this.reportRepository.findById(id);

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
      switch (r.reportType) {
        case 'USER':
          const user = await this.userRepository.findOneById(r.referenceId);
          r.referencedUser = plainToInstance(UserDto, user);
          break;
        case 'PHOTO':
          const photo = await this.photoService.getSignedPhotoById(
            '',
            r.referenceId,
            false,
          );

          r.referencedPhoto = plainToInstance(PhotoDto, photo);
          break;
        case 'COMMENT':
          const comment = await this.commentRepository.findById(r.referenceId);
          r.referencedComment = plainToInstance(CommentEntity, comment);
          break;
        case 'BOOKING':
          throw new NotImplementedException();

        default:
          break;
      }

      return r;
    });

    const reportWithEntities = await Promise.all(
      reportWithReferenceEntityPromises,
    );

    return new ReportFindAllResponseDto(
      reportFindAllDto.limit,
      count,
      reportWithEntities,
    );
  }
}
