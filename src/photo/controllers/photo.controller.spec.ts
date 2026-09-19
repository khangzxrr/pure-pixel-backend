import { Queue } from 'bullmq';
import { Response } from 'express';
import { PassThrough } from 'stream';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoConstant } from '../constants/photo.constant';
import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { FindNextPhotoFilterDto } from '../dtos/find-next.filter.dto';
import { DownloadTemporaryPhotoDto } from '../dtos/rest/download-temporary-photo.request.dto';
import { FileSystemPhotoUploadRequestDto } from '../dtos/rest/file-system-photo-upload.request';
import { PhotoUploadRequestDto } from '../dtos/rest/photo-upload.request';
import { SharePhotoRequestDto } from '../dtos/rest/share-photo.request.dto';
import { PhotoService } from '../services/photo.service';
import { PhotoController } from './photo.controller';

describe('PhotoController', () => {
  const user = { sub: 'u1' } as ParsedUserDto;
  const anonymous = undefined as unknown as ParsedUserDto;
  let photoService: Record<
    | 'findNextPublicPhotos'
    | 'findPublicPhotos'
    | 'deleteById'
    | 'findById'
    | 'sendImageWatermarkQueue'
    | 'updatePhoto'
    | 'uploadPhoto'
    | 'fileSystemPhotoUpload'
    | 'downloadTemporaryPhoto'
    | 'getAvailablePhotoResolution'
    | 'sharePhoto',
    jest.Mock
  >;
  let viewCountQueue: Record<'add', jest.Mock>;
  let controller: PhotoController;

  beforeEach(() => {
    photoService = {
      findNextPublicPhotos: jest.fn().mockResolvedValue('next'),
      findPublicPhotos: jest.fn().mockResolvedValue('public'),
      deleteById: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue('photo'),
      sendImageWatermarkQueue: jest.fn().mockResolvedValue('watermarked'),
      updatePhoto: jest.fn().mockResolvedValue('updated'),
      uploadPhoto: jest.fn().mockResolvedValue('uploaded'),
      fileSystemPhotoUpload: jest.fn().mockResolvedValue('uploaded-v2'),
      downloadTemporaryPhoto: jest.fn().mockResolvedValue(Buffer.from('img')),
      getAvailablePhotoResolution: jest.fn().mockResolvedValue([]),
      sharePhoto: jest.fn().mockResolvedValue('shared'),
    };
    viewCountQueue = { add: jest.fn().mockResolvedValue({}) };
    controller = new PhotoController(
      photoService as unknown as PhotoService,
      viewCountQueue as unknown as Queue,
    );
  });

  describe('getNextPublicPhoto', () => {
    const filter = new FindNextPhotoFilterDto();

    it('passes user id when authenticated', async () => {
      await expect(controller.getNextPublicPhoto(user, filter)).resolves.toBe(
        'next',
      );
      expect(photoService.findNextPublicPhotos).toHaveBeenCalledWith(
        'u1',
        filter,
      );
    });

    it('passes empty user id when anonymous', async () => {
      await controller.getNextPublicPhoto(anonymous, filter);
      expect(photoService.findNextPublicPhotos).toHaveBeenCalledWith(
        '',
        filter,
      );
    });
  });

  describe('getAllPublicPhoto', () => {
    const filter = new FindAllPhotoFilterDto();

    it('passes user id when authenticated', async () => {
      await expect(controller.getAllPublicPhoto(user, filter)).resolves.toBe(
        'public',
      );
      expect(photoService.findPublicPhotos).toHaveBeenCalledWith('u1', filter);
    });

    it('passes empty user id when anonymous', async () => {
      await controller.getAllPublicPhoto(anonymous, filter);
      expect(photoService.findPublicPhotos).toHaveBeenCalledWith('', filter);
    });
  });

  it('deletes a photo', async () => {
    await expect(controller.deletePhoto(user, 'p1')).resolves.toBe(true);
    expect(photoService.deleteById).toHaveBeenCalledWith('u1', 'p1');
  });

  describe('findPhotoById', () => {
    it('queues view count and finds photo for authenticated user', async () => {
      await expect(controller.findPhotoById(user, 'p1')).resolves.toBe('photo');
      expect(viewCountQueue.add).toHaveBeenCalledWith(
        PhotoConstant.INCREASE_VIEW_COUNT_JOB,
        { id: 'p1' },
      );
      expect(photoService.findById).toHaveBeenCalledWith('u1', 'p1');
    });

    it('finds photo for anonymous user', async () => {
      await controller.findPhotoById(anonymous, 'p1');
      expect(photoService.findById).toHaveBeenCalledWith('', 'p1');
    });
  });

  it('generates watermark', async () => {
    const dto = { text: 'PXL' };

    await expect(controller.generateWatermark(user, dto, 'p1')).resolves.toBe(
      'watermarked',
    );
    expect(photoService.sendImageWatermarkQueue).toHaveBeenCalledWith(
      'u1',
      'p1',
      dto,
    );
  });

  it('updates a photo', async () => {
    const dto = { title: 'x' };

    await expect(controller.updatePhoto(user, 'p1', dto)).resolves.toBe(
      'updated',
    );
    expect(photoService.updatePhoto).toHaveBeenCalledWith('u1', 'p1', dto);
  });

  it('uploads a photo', async () => {
    const body = new PhotoUploadRequestDto();

    await expect(controller.uploadPhoto(user, body)).resolves.toBe('uploaded');
    expect(photoService.uploadPhoto).toHaveBeenCalledWith('u1', body);
  });

  it('uploads a photo to file system', async () => {
    const body = new FileSystemPhotoUploadRequestDto();

    await expect(controller.uploadPhotoV2(user, body)).resolves.toBe(
      'uploaded-v2',
    );
    expect(photoService.fileSystemPhotoUpload).toHaveBeenCalledWith('u1', body);
  });

  it('streams temporary photo to the response', async () => {
    const res = Object.assign(new PassThrough(), { set: jest.fn() });
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise((resolve) => res.on('end', resolve));
    const dto = { width: 800 } as DownloadTemporaryPhotoDto;

    await controller.downloadTemporaryPhoto(
      'p1',
      dto,
      res as unknown as Response,
    );
    await finished;

    expect(photoService.downloadTemporaryPhoto).toHaveBeenCalledWith('p1', dto);
    expect(res.set).toHaveBeenCalledWith({ 'Content-type': 'image/jpeg' });
    expect(Buffer.concat(chunks).toString()).toBe('img');
  });

  describe('getPhotoAvailableResolution', () => {
    const createResponse = () => {
      const res = { status: jest.fn(), send: jest.fn() };
      res.status.mockReturnValue(res);
      return res;
    };

    it('responds 201 when service returns a Boolean object', async () => {
      photoService.getAvailablePhotoResolution.mockResolvedValue(
        new Boolean(true),
      );
      const res = createResponse();

      await controller.getPhotoAvailableResolution(
        'p1',
        res as unknown as Response,
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith();
    });

    it('responds 200 with available resolutions', async () => {
      const resolutions = [{ width: 1000, height: 800 }];
      photoService.getAvailablePhotoResolution.mockResolvedValue(resolutions);
      const res = createResponse();

      await controller.getPhotoAvailableResolution(
        'p1',
        res as unknown as Response,
      );

      expect(photoService.getAvailablePhotoResolution).toHaveBeenCalledWith(
        'p1',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(resolutions);
    });
  });

  it('shares a photo', async () => {
    const body = { photoId: 'p1' } as SharePhotoRequestDto;

    await expect(controller.sharePhoto(user, body)).resolves.toBe('shared');
    expect(photoService.sharePhoto).toHaveBeenCalledWith('u1', body);
  });
});
