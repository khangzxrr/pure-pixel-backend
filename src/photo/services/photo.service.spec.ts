import { Test } from '@nestjs/testing';
import { PhotoService } from './photo.service';
import { StorageModule } from 'src/storage/storage.module';
import { QueueModule } from 'src/queue/queue.module';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { SignedUpload } from '../dtos/presigned-upload-url.response.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotographerNotFoundException } from 'src/photographer/exceptions/photographer-not-found.exception';
import { RunOutPhotoQuotaException } from '../exceptions/run-out-photo-quota.exception';

describe('PhotoService', () => {
  let photoService: PhotoService;
  const photoRepository = {
    //lazy mock, write full object if required
    createTemporaryPhotos: (userId: string, signedUploads: SignedUpload[]) => {
      const result = signedUploads.map((su) => {
        return {
          id: '90ff5312-51e1-456b-ad05-67e175ac532c',
          originalPhotoUrl: su.storageObject,
        };
      });
      return Promise.resolve(result);
    },
  };

  const userRepository = {
    findUserQuotaById: () => {
      return Promise.resolve({
        maxPhotoQuota: 0,
        maxBookingPhotoQuota: 0,
        maxBookingVideoQuota: 0,
        maxPackageCount: 0,
      });
    },
  };

  const userId = '6db1c6a1-f4ab-4ecb-a489-9285ebb53135';
  const presignedUploadUrlRequest = new PresignedUploadUrlRequest();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule, QueueModule],
      providers: [
        PhotoService,
        {
          provide: PhotoRepository,
          useValue: photoRepository,
        },
        {
          provide: UserRepository,
          useValue: userRepository,
        },
      ],
    }).compile();

    photoService = moduleRef.get<PhotoService>(PhotoService);
  });

  it('should define service', async () => {
    expect(photoService).toBeDefined();
  });

  describe('getPresignedUploadUrl', () => {
    it('should throw FileIsNotValidException when extension is empty', () => {
      presignedUploadUrlRequest.filenames = ['test'];

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(FileIsNotValidException);
    });

    it('should throw FileIsNotValidException when extension is not valid', async () => {
      presignedUploadUrlRequest.filenames = ['test.abc'];

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(FileIsNotValidException);
    });

    it('should return correct SignedUpload when filename is valid', async () => {
      presignedUploadUrlRequest.filenames = ['test.jpg'];

      const result = await photoService.getPresignedUploadUrl(
        userId,
        presignedUploadUrlRequest,
      );

      expect(result).toHaveProperty('signedUploads');
      expect(result.signedUploads[0].uploadUrl.length > 0).toBeTruthy();
    });

    it('should throw PhotographerNotFoundException when userid is not found', () => {
      jest
        .spyOn(userRepository, 'findUserQuotaById')
        .mockImplementation(async () => Promise.resolve(null));

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(PhotographerNotFoundException);
    });

    it('should throw RunOutPhotoQuotaException when current quota usage is larger or equal max photo quota', () => {
      jest
        .spyOn(userRepository, 'findUserQuotaById')
        .mockImplementation(async () =>
          Promise.resolve({
            photoQuotaUsage: 5242880, //bytes
            maxPhotoQuota: 5242880,

            maxPackageCount: 0,
            maxBookingPhotoQuota: 0,
            maxBookingVideoQuota: 0,
          }),
        );

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(RunOutPhotoQuotaException);
    });
  });
});
