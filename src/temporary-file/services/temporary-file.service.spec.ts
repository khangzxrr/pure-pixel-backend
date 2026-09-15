import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { PhotoNotFoundException } from 'src/photo/exceptions/photo-not-found.exception';
import { TemporaryfileConstant } from '../constants/temporary-file.constant';
import { PathNotValidException } from '../exceptions/path-not-valid.exception';
import { TemporaryfileService } from './temporary-file.service';

describe('TemporaryfileService', () => {
  const originalBackendOrigin = process.env.BACKEND_ORIGIN;

  let photoProcessService: jest.Mocked<
    Pick<PhotoProcessService, 'sharpInitFromFilePath'>
  >;
  let service: TemporaryfileService;

  beforeEach(() => {
    process.env.BACKEND_ORIGIN = 'https://api.example.com';

    photoProcessService = {
      sharpInitFromFilePath: jest.fn(),
    };

    service = new TemporaryfileService(
      photoProcessService as unknown as PhotoProcessService,
    );
  });

  afterAll(() => {
    process.env.BACKEND_ORIGIN = originalBackendOrigin;
  });

  describe('signFilesystemPath', () => {
    it('should prefix the temp directory when path is relative', () => {
      const result = service.signFilesystemPath('photo.jpg');

      expect(result).toBe(
        `https://api.example.com/temporary-file?path=${encodeURIComponent(
          `${TemporaryfileConstant.TEMP_DIRECTORY}/photo.jpg`,
        )}`,
      );
    });

    it('should keep the path when it already contains the temp directory', () => {
      const path = `${TemporaryfileConstant.TEMP_DIRECTORY}/a/b.jpg`;

      const result = service.signFilesystemPath(path);

      expect(result).toBe(
        `https://api.example.com/temporary-file?path=${encodeURIComponent(path)}`,
      );
    });
  });

  describe('pathToBuffer', () => {
    const validPath = `${TemporaryfileConstant.TEMP_DIRECTORY}/photo.jpg`;

    it('should throw PathNotValidException when path is outside temp directory', async () => {
      await expect(service.pathToBuffer('/etc/passwd')).rejects.toBeInstanceOf(
        PathNotValidException,
      );
      expect(photoProcessService.sharpInitFromFilePath).not.toHaveBeenCalled();
    });

    it('should return buffer from sharp', async () => {
      const buffer = Buffer.from('image');
      const toBuffer = jest.fn().mockResolvedValue(buffer);
      photoProcessService.sharpInitFromFilePath.mockResolvedValue({
        toBuffer,
      } as never);

      const result = await service.pathToBuffer(validPath);

      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        validPath,
      );
      expect(result).toBe(buffer);
    });

    it('should throw PhotoNotFoundException when input file is missing', async () => {
      photoProcessService.sharpInitFromFilePath.mockResolvedValue({
        toBuffer: jest
          .fn()
          .mockRejectedValue(new Error('Input file is missing: x')),
      } as never);

      await expect(service.pathToBuffer(validPath)).rejects.toBeInstanceOf(
        PhotoNotFoundException,
      );
    });

    it('should rethrow other errors unchanged', async () => {
      const error = new Error('corrupted');
      photoProcessService.sharpInitFromFilePath.mockRejectedValue(error);

      await expect(service.pathToBuffer(validPath)).rejects.toBe(error);
    });

    it('should rethrow non Error values unchanged', async () => {
      photoProcessService.sharpInitFromFilePath.mockRejectedValue(
        'Input file is missing',
      );

      await expect(service.pathToBuffer(validPath)).rejects.toBe(
        'Input file is missing',
      );
    });
  });
});
