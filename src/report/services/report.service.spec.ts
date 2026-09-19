import { ReportType } from '@prisma/client';
import { BookingDto } from 'src/booking/dtos/booking.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { CommentRepository } from 'src/database/repositories/comment.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { ReportRepository } from 'src/database/repositories/report.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { CommentDto } from 'src/photo/dtos/comment-dto';
import { PhotoService } from 'src/photo/services/photo.service';
import { UserDto } from 'src/user/dtos/user.dto';
import { ReportDto } from '../dtos/report.dto';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportFindAllResponseDto } from '../dtos/rest/report-find-all.response.dto';
import { ReportPathUpdateDto } from '../dtos/rest/report-patch-update.request.dto';
import { ReportPutUpdateRequestDto } from '../dtos/rest/report-put-update.request.dto';
import { NotBelongReportException } from '../exceptions/not-belong-report.exception';
import { ReferenceIdNotFoundException } from '../exceptions/referenced-id-is-not-found.exception';
import { ReportNotFoundException } from '../exceptions/report-not-found.exception';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let reportRepository: jest.Mocked<
    Pick<
      ReportRepository,
      | 'findUniqueOrThrow'
      | 'delete'
      | 'updateById'
      | 'create'
      | 'count'
      | 'findAll'
    >
  >;
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findUniqueOrThrow' | 'findUnique'>
  >;
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'findUniqueOrThrow'>>;
  let commentRepository: jest.Mocked<
    Pick<CommentRepository, 'findUniqueOrThrow'>
  >;
  let photoService: jest.Mocked<Pick<PhotoService, 'findById'>>;
  let bookingRepository: jest.Mocked<
    Pick<BookingRepository, 'findUniqueOrThrow'>
  >;
  let service: ReportService;

  const makeReport = (
    reportType: ReportType | string,
    overrides: Record<string, unknown> = {},
  ) => ({
    id: `report-${reportType}`,
    reportType,
    reportStatus: 'OPEN',
    userId: 'u1',
    referenceId: `ref-${reportType}`,
    content: 'bad',
    archived: false,
    ...overrides,
  });

  const makeFindAllDto = (overrides: Partial<ReportFindAllRequestDto> = {}) =>
    Object.assign(new ReportFindAllRequestDto(), {
      limit: 10,
      page: 0,
      ...overrides,
    });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    reportRepository = {
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
      updateById: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findAll: jest.fn(),
    };
    userRepository = {
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn(),
    };
    photoRepository = { findUniqueOrThrow: jest.fn() };
    commentRepository = { findUniqueOrThrow: jest.fn() };
    photoService = { findById: jest.fn() };
    bookingRepository = { findUniqueOrThrow: jest.fn() };

    service = new ReportService(
      reportRepository as unknown as ReportRepository,
      userRepository as unknown as UserRepository,
      photoRepository as unknown as PhotoRepository,
      commentRepository as unknown as CommentRepository,
      photoService as unknown as PhotoService,
      bookingRepository as unknown as BookingRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateReferenceId', () => {
    it('should validate USER reference', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({ id: 'u' } as never);

      await expect(
        service.validateReferenceId('USER', 'u'),
      ).resolves.toBeUndefined();
      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledWith('u');
    });

    it('should validate PHOTO reference', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({ id: 'p' } as never);

      await service.validateReferenceId('PHOTO', 'p');

      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith('p');
    });

    it.each(['BOOKING', 'BOOKING_PHOTOGRAPHER_REPORT_USER'] as const)(
      'should validate %s reference',
      async (type) => {
        bookingRepository.findUniqueOrThrow.mockResolvedValue({
          id: 'b',
        } as never);

        await service.validateReferenceId(type, 'b');

        expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
          id: 'b',
        });
      },
    );

    it('should validate COMMENT reference', async () => {
      commentRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'c',
      } as never);

      await service.validateReferenceId('COMMENT', 'c');

      expect(commentRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'c',
      });
    });

    it('should throw ReferenceIdNotFoundException when lookup returns nothing', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue(null as never);

      await expect(
        service.validateReferenceId('USER', 'missing'),
      ).rejects.toBeInstanceOf(ReferenceIdNotFoundException);
    });

    it('should throw ReferenceIdNotFoundException for unsupported type', async () => {
      await expect(
        service.validateReferenceId('UNKNOWN' as ReportType, 'x'),
      ).rejects.toBeInstanceOf(ReferenceIdNotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete report', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      reportRepository.delete.mockResolvedValue(makeReport('USER') as never);

      const result = await service.delete('r1');

      expect(reportRepository.delete).toHaveBeenCalledWith('r1');
      expect(result).toBeInstanceOf(ReportDto);
    });

    it('should throw ReportNotFoundException when report is missing', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(null as never);

      await expect(service.delete('r1')).rejects.toBeInstanceOf(
        ReportNotFoundException,
      );
      expect(reportRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('replace', () => {
    const putDto = Object.assign(new ReportPutUpdateRequestDto(), {
      content: 'new',
      reportStatus: 'CLOSED',
      reportType: 'PHOTO',
      referenceId: 'p1',
    });

    it('should validate reference and update report', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
      } as never);
      reportRepository.updateById.mockResolvedValue(
        makeReport('PHOTO') as never,
      );

      const result = await service.replace('r1', putDto);

      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith('p1');
      expect(reportRepository.updateById).toHaveBeenCalledWith('r1', putDto);
      expect(result).toBeInstanceOf(ReportDto);
    });

    it('should throw ReportNotFoundException when report is missing', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(null as never);

      await expect(service.replace('r1', putDto)).rejects.toBeInstanceOf(
        ReportNotFoundException,
      );
      expect(reportRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should validate reference and create open report', async () => {
      commentRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'c1',
      } as never);
      reportRepository.create.mockResolvedValue(makeReport('COMMENT') as never);

      const dto = Object.assign(new ReportCreateRequestDto(), {
        content: 'spam',
        reportType: 'COMMENT',
        referenceId: 'c1',
      });

      const result = await service.create('u1', dto);

      expect(reportRepository.create).toHaveBeenCalledWith({
        user: { connect: { id: 'u1' } },
        content: 'spam',
        archived: false,
        reportType: 'COMMENT',
        referenceId: 'c1',
        reportStatus: 'OPEN',
      });
      expect(result).toBeInstanceOf(ReportDto);
    });

    it('should not create report when reference is invalid', async () => {
      commentRepository.findUniqueOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.create(
          'u1',
          Object.assign(new ReportCreateRequestDto(), {
            content: 'spam',
            reportType: 'COMMENT',
            referenceId: 'c1',
          }),
        ),
      ).rejects.toThrow('not found');
      expect(reportRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('patchUpdate', () => {
    beforeEach(() => {
      reportRepository.updateById.mockResolvedValue(
        makeReport('USER') as never,
      );
    });

    it('should throw ReportNotFoundException when report is missing', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(null as never);

      await expect(service.patchUpdate('r1', {})).rejects.toBeInstanceOf(
        ReportNotFoundException,
      );
    });

    it('should skip reference validation when referenceId is not provided', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      const dto: ReportPathUpdateDto = { reportStatus: 'RESPONSED' };

      const result = await service.patchUpdate('r1', dto);

      expect(userRepository.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(reportRepository.updateById).toHaveBeenCalledWith('r1', dto);
      expect(result).toBeInstanceOf(ReportDto);
    });

    it('should validate with new report type when provided', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p2',
      } as never);

      await service.patchUpdate('r1', {
        reportType: 'PHOTO',
        referenceId: 'p2',
      });

      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith('p2');
      expect(userRepository.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('should validate with existing report type when type is not provided', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      userRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'u2',
      } as never);

      await service.patchUpdate('r1', { referenceId: 'u2' });

      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledWith('u2');
    });
  });

  describe('findAll', () => {
    it('should attach referenced entities for each report type', async () => {
      const dto = makeFindAllDto({ search: 'x', orderByCreatedAt: 'desc' });
      reportRepository.count.mockResolvedValue(6);
      reportRepository.findAll.mockResolvedValue([
        makeReport('USER'),
        makeReport('PHOTO'),
        makeReport('COMMENT'),
        makeReport('BOOKING'),
        makeReport('BOOKING_PHOTOGRAPHER_REPORT_USER'),
        makeReport('OTHER'),
      ] as never);
      userRepository.findUnique.mockResolvedValue({ id: 'ref-USER' } as never);
      const signedPhoto = { id: 'ref-PHOTO' };
      photoService.findById.mockResolvedValue(signedPhoto as never);
      commentRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'ref-COMMENT',
      } as never);
      bookingRepository.findUniqueOrThrow.mockImplementation(
        async (where) => ({ id: where.id }) as never,
      );

      const result = await service.findAll(dto);

      expect(reportRepository.count).toHaveBeenCalledWith(dto.toWhere());
      expect(reportRepository.findAll).toHaveBeenCalledWith(
        10,
        0,
        dto.toWhere(),
        dto.toOrderBy(),
      );
      expect(result).toBeInstanceOf(ReportFindAllResponseDto);
      expect(result.totalRecord).toBe(6);

      const [user, photo, comment, booking, photographerBooking, other] =
        result.objects;

      expect(userRepository.findUnique).toHaveBeenCalledWith('ref-USER', {});
      expect(user.referencedUser).toBeInstanceOf(UserDto);

      expect(photoService.findById).toHaveBeenCalledWith(
        '',
        'ref-PHOTO',
        false,
      );
      expect(photo.referencedPhoto).toBe(signedPhoto);

      expect(commentRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'ref-COMMENT',
      });
      expect(comment.referencedComment).toBeInstanceOf(CommentDto);

      expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'ref-BOOKING',
      });
      expect(booking.referencedBooking).toBeInstanceOf(BookingDto);
      expect(booking.reportStatus).toBe('OPEN');

      expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'ref-BOOKING_PHOTOGRAPHER_REPORT_USER',
      });
      expect(photographerBooking.referencedBooking).toBeInstanceOf(BookingDto);

      expect(other.referencedUser).toBeUndefined();
      expect(other.referencedBooking).toBeUndefined();

      expect(reportRepository.updateById).not.toHaveBeenCalled();
    });

    it('should close report and null the reference when lookup fails', async () => {
      reportRepository.count.mockResolvedValue(4);
      reportRepository.findAll.mockResolvedValue([
        makeReport('USER'),
        makeReport('PHOTO'),
        makeReport('COMMENT'),
        makeReport('BOOKING_PHOTOGRAPHER_REPORT_USER'),
      ] as never);
      userRepository.findUnique.mockRejectedValue(new Error('gone'));
      photoService.findById.mockRejectedValue(new Error('gone'));
      commentRepository.findUniqueOrThrow.mockRejectedValue(new Error('gone'));
      bookingRepository.findUniqueOrThrow.mockRejectedValue(new Error('gone'));

      const result = await service.findAll(makeFindAllDto());

      const [user, photo, comment, booking] = result.objects;

      expect(user.referencedUser).toBeNull();
      expect(photo.referencedPhoto).toBeNull();
      expect(comment.referencedComment).toBeNull();
      expect(booking.referencedBooking).toBeNull();
      result.objects.forEach((r) => expect(r.reportStatus).toBe('CLOSED'));

      expect(reportRepository.updateById).toHaveBeenCalledTimes(4);
      expect(reportRepository.updateById).toHaveBeenCalledWith('report-USER', {
        reportStatus: 'CLOSED',
      });
    });

    it('should close BOOKING report when booking lookup fails', async () => {
      reportRepository.count.mockResolvedValue(1);
      reportRepository.findAll.mockResolvedValue([
        makeReport('BOOKING'),
      ] as never);
      bookingRepository.findUniqueOrThrow.mockRejectedValue(new Error('gone'));

      const result = await service.findAll(makeFindAllDto());

      expect(result.objects[0].reportStatus).toBe('CLOSED');
      expect(result.objects[0].referencedBooking).toBeNull();
      expect(reportRepository.updateById).toHaveBeenCalledWith(
        'report-BOOKING',
        { reportStatus: 'CLOSED' },
      );
    });
  });

  describe('findAllOfUser', () => {
    it('should scope query to user and attach references', async () => {
      const dto = makeFindAllDto({ page: 1, limit: 2 });
      reportRepository.count.mockResolvedValue(5);
      reportRepository.findAll.mockResolvedValue([
        makeReport('USER'),
        makeReport('PHOTO'),
        makeReport('COMMENT'),
        makeReport('BOOKING'),
        makeReport('BOOKING_PHOTOGRAPHER_REPORT_USER'),
      ] as never);
      userRepository.findUnique.mockResolvedValue({ id: 'ref-USER' } as never);
      photoService.findById.mockResolvedValue({ id: 'ref-PHOTO' } as never);
      commentRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'ref-COMMENT',
      } as never);
      bookingRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'ref-BOOKING',
      } as never);

      const result = await service.findAllOfUser('u1', dto);

      const expectedWhere = { ...dto.toWhere(), userId: 'u1' };
      expect(reportRepository.count).toHaveBeenCalledWith(expectedWhere);
      expect(reportRepository.findAll).toHaveBeenCalledWith(
        2,
        2,
        expectedWhere,
        dto.toOrderBy(),
      );
      expect(result.totalPage).toBe(3);

      const [user, photo, comment, booking] = result.objects;
      expect(user.referencedUser).toBeInstanceOf(UserDto);
      expect(photo.referencedPhoto).toEqual({ id: 'ref-PHOTO' });
      expect(comment.referencedComment).toBeInstanceOf(CommentDto);
      expect(booking.referencedBooking).toBeInstanceOf(BookingDto);
      expect(reportRepository.updateById).not.toHaveBeenCalled();
    });

    it('should close report and null the reference when lookup fails', async () => {
      reportRepository.count.mockResolvedValue(4);
      reportRepository.findAll.mockResolvedValue([
        makeReport('USER'),
        makeReport('PHOTO'),
        makeReport('COMMENT'),
        makeReport('BOOKING'),
      ] as never);
      userRepository.findUnique.mockRejectedValue(new Error('gone'));
      photoService.findById.mockRejectedValue(new Error('gone'));
      commentRepository.findUniqueOrThrow.mockRejectedValue(new Error('gone'));
      bookingRepository.findUniqueOrThrow.mockRejectedValue(new Error('gone'));

      const result = await service.findAllOfUser('u1', makeFindAllDto());

      const [user, photo, comment, booking] = result.objects;
      expect(user.referencedUser).toBeNull();
      expect(photo.referencedPhoto).toBeNull();
      expect(comment.referencedComment).toBeNull();
      expect(booking.referencedBooking).toBeNull();
      result.objects.forEach((r) => expect(r.reportStatus).toBe('CLOSED'));
      expect(reportRepository.updateById).toHaveBeenCalledTimes(4);
    });
  });

  describe('patchUpdateOfUser', () => {
    it('should throw NotBelongReportException for other users report', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER', { userId: 'other' }) as never,
      );

      await expect(
        service.patchUpdateOfUser('u1', 'r1', { content: 'x' }),
      ).rejects.toBeInstanceOf(NotBelongReportException);
      expect(reportRepository.updateById).not.toHaveBeenCalled();
    });

    it('should delegate to patchUpdate for own report', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      const updated = new ReportDto();
      const spy = jest.spyOn(service, 'patchUpdate').mockResolvedValue(updated);

      const result = await service.patchUpdateOfUser('u1', 'r1', {
        content: 'x',
      });

      expect(spy).toHaveBeenCalledWith('r1', expect.any(ReportPathUpdateDto));
      expect(spy.mock.calls[0][1]).toMatchObject({ content: 'x' });
      expect(result).toBe(updated);
    });
  });

  describe('replaceOfUser', () => {
    const dto = {
      content: 'x',
      reportType: 'USER' as const,
      referenceId: 'u2',
    };

    it('should throw NotBelongReportException for other users report', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER', { userId: 'other' }) as never,
      );

      await expect(
        service.replaceOfUser('u1', 'r1', dto),
      ).rejects.toBeInstanceOf(NotBelongReportException);
    });

    it('should delegate to replace for own report', async () => {
      reportRepository.findUniqueOrThrow.mockResolvedValue(
        makeReport('USER') as never,
      );
      const replaced = new ReportDto();
      const spy = jest.spyOn(service, 'replace').mockResolvedValue(replaced);

      const result = await service.replaceOfUser('u1', 'r1', dto);

      expect(spy).toHaveBeenCalledWith(
        'r1',
        expect.any(ReportPutUpdateRequestDto),
      );
      expect(spy.mock.calls[0][1]).toMatchObject(dto);
      expect(result).toBe(replaced);
    });
  });
});
