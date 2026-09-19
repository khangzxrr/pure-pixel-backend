import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { UserRepository } from 'src/database/repositories/user.repository';
import { IdentityService } from 'src/authen/services/identity.service';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoProcessConsumer } from 'src/photo/consumers/photo-process.consumer';
import { UserService } from 'src/user/services/user.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { PhotoGenerateWatermarkService } from 'src/photo/services/photo-generate-watermark.service';
import { DashboardReportRepository } from 'src/database/repositories/dashboard-report.repository';
import { PhotoConstant } from 'src/photo/constants/photo.constant';
import { Constants } from 'src/infrastructure/utils/constants';
import { CannotCreateNewUserException } from 'src/user/exceptions/cannot-create-new-user.exception';
import { PhotoUploadRequestDto } from 'src/photo/dtos/rest/photo-upload.request';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  const userRepository = { upsert: jest.fn() };
  const keycloakService = { upsert: jest.fn() };
  const photoService = { uploadPhoto: jest.fn(), updatePhoto: jest.fn() };
  const photoProcessConsumer = { processPhoto: jest.fn() };
  const userService = { syncKeycloakWithDatabase: jest.fn() };
  const photoRepository = { findAll: jest.fn() };
  const photoGenerateWatermark = { generateWatermark: jest.fn() };
  const photoProcessQueue = { addBulk: jest.fn() };
  const dashboardReportRepository = { findMany: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UserRepository, useValue: userRepository },
        { provide: IdentityService, useValue: keycloakService },
        { provide: PhotoService, useValue: photoService },
        { provide: PhotoProcessConsumer, useValue: photoProcessConsumer },
        { provide: UserService, useValue: userService },
        { provide: PhotoRepository, useValue: photoRepository },
        {
          provide: PhotoGenerateWatermarkService,
          useValue: photoGenerateWatermark,
        },
        {
          provide: getQueueToken(PhotoConstant.PHOTO_PROCESS_QUEUE),
          useValue: photoProcessQueue,
        },
        {
          provide: DashboardReportRepository,
          useValue: dashboardReportRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(AdminService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getDashboardReport should query reports in date range', async () => {
    const fromDate = new Date('2024-01-01T00:00:00Z');
    const toDate = new Date('2024-02-01T00:00:00Z');
    dashboardReportRepository.findMany.mockResolvedValue(['report']);

    await expect(
      service.getDashboardReport({ fromDate, toDate }),
    ).resolves.toEqual(['report']);
    expect(dashboardReportRepository.findMany).toHaveBeenCalledWith({
      createdAt: { gte: fromDate, lte: toDate },
    });
  });

  it('syncUsers should delegate to user service', async () => {
    userService.syncKeycloakWithDatabase.mockResolvedValue('synced');

    await expect(service.syncUsers()).resolves.toBe('synced');
  });

  it('triggerProcessAllPhotos should queue photos page by page until no photo left', async () => {
    photoRepository.findAll
      .mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }])
      .mockResolvedValueOnce([]);

    await service.triggerProcessAllPhotos();

    expect(photoRepository.findAll).toHaveBeenNthCalledWith(1, {}, [], 0, 100);
    expect(photoRepository.findAll).toHaveBeenNthCalledWith(2, {}, [], 2, 100);
    expect(photoProcessQueue.addBulk).toHaveBeenNthCalledWith(1, [
      { name: PhotoConstant.PROCESS_PHOTO_JOB_NAME, data: { id: 'p1' } },
      { name: PhotoConstant.PROCESS_PHOTO_JOB_NAME, data: { id: 'p2' } },
    ]);
    expect(photoProcessQueue.addBulk).toHaveBeenNthCalledWith(2, []);
  });

  it('generateWatermarkPhoto should generate PXL watermark', async () => {
    photoGenerateWatermark.generateWatermark.mockResolvedValue('done');

    await expect(service.generateWatermarkPhoto('photo-1')).resolves.toBe(
      'done',
    );
    expect(photoGenerateWatermark.generateWatermark).toHaveBeenCalledWith(
      'photo-1',
      { text: 'PXL' },
    );
  });

  it('triggerProcess should process photo', async () => {
    photoProcessConsumer.processPhoto.mockResolvedValue('processed');

    await expect(service.triggerProcess('photo-1')).resolves.toBe('processed');
    expect(photoProcessConsumer.processPhoto).toHaveBeenCalledWith('photo-1');
  });

  describe('file readers', () => {
    it('readRandomUsernames should split csv lines', () => {
      const readSpy = jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue('alice\nbob');

      expect(service.readRandomUsernames()).toEqual(['alice', 'bob']);
      expect(readSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), './prisma/random_username.csv'),
        'utf-8',
      );
    });

    it('readImageList should list images directory', () => {
      const readdirSpy = jest
        .spyOn(fs, 'readdirSync')
        .mockReturnValue(['a.jpg'] as unknown as ReturnType<
          typeof fs.readdirSync
        >);

      expect(service.readImageList()).toEqual(['a.jpg']);
      expect(readdirSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), './images'),
      );
    });

    it('readFileToBuffer should read file relative to cwd', () => {
      const buffer = Buffer.from('img');
      const readSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(buffer);

      expect(service.readFileToBuffer('./images/a.jpg')).toBe(buffer);
      expect(readSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), './images/a.jpg'),
      );
    });
  });

  describe('seed', () => {
    it('should throw CannotCreateNewUserException when keycloak user has no id', async () => {
      jest.spyOn(service, 'readRandomUsernames').mockReturnValue(['alice']);
      jest.spyOn(service, 'readImageList').mockReturnValue(['a.jpg']);
      keycloakService.upsert.mockResolvedValue({ username: 'alice' });

      await expect(service.seed()).rejects.toThrow(
        CannotCreateNewUserException,
      );
      expect(userRepository.upsert).not.toHaveBeenCalled();
    });

    it('should stop when reaching an empty username', async () => {
      jest.spyOn(service, 'readRandomUsernames').mockReturnValue(['  ', 'bob']);
      jest.spyOn(service, 'readImageList').mockReturnValue(['a.jpg']);

      await expect(service.seed()).resolves.toBeUndefined();
      expect(keycloakService.upsert).not.toHaveBeenCalled();
    });

    it('should create photographers and upload their photos', async () => {
      jest
        .spyOn(service, 'readRandomUsernames')
        .mockReturnValue([' alice ', 'bob']);
      jest
        .spyOn(service, 'readImageList')
        .mockReturnValue(['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg']);
      const readFileSpy = jest
        .spyOn(service, 'readFileToBuffer')
        .mockImplementation((filepath: string) => Buffer.from(filepath));
      keycloakService.upsert.mockImplementation(async (username: string) => ({
        id: `${username}-id`,
      }));
      userRepository.upsert.mockImplementation(
        async (user: { id: string }) => user,
      );
      photoService.uploadPhoto
        .mockResolvedValueOnce({ id: 'photo-a' })
        .mockRejectedValueOnce(new Error('upload failed'))
        .mockResolvedValueOnce({ id: 'photo-c' })
        .mockResolvedValueOnce({ id: 'photo-d' });

      await service.seed();

      expect(keycloakService.upsert).toHaveBeenCalledWith(
        'alice',
        'alice@gmail.com',
        Constants.PHOTOGRAPHER_ROLE,
      );
      expect(keycloakService.upsert).toHaveBeenCalledWith(
        'bob',
        'bob@gmail.com',
        Constants.PHOTOGRAPHER_ROLE,
      );
      expect(userRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'alice-id',
          mail: 'alice@gmail.com',
          name: 'alice',
          normalizedName: 'alice',
        }),
      );

      // 5 images / 2 users => 2 images per user
      expect(photoService.uploadPhoto).toHaveBeenCalledTimes(4);
      const firstUpload: PhotoUploadRequestDto =
        photoService.uploadPhoto.mock.calls[0][1];
      expect(photoService.uploadPhoto.mock.calls[0][0]).toBe('alice-id');
      // the list is shifted before reading, so the first image is skipped
      expect(firstUpload.file.originalName).toBe('2.jpg');
      expect(readFileSpy).toHaveBeenNthCalledWith(1, './images/2.jpg');
      expect(firstUpload.file.size).toBe(
        Buffer.from('./images/2.jpg').byteLength,
      );

      expect(photoService.updatePhoto).toHaveBeenCalledTimes(3);
      expect(photoService.updatePhoto).toHaveBeenCalledWith(
        'alice-id',
        'photo-a',
        { visibility: 'PUBLIC' },
      );
      expect(photoService.updatePhoto).toHaveBeenCalledWith(
        'bob-id',
        'photo-d',
        { visibility: 'PUBLIC' },
      );
    });
  });
});
