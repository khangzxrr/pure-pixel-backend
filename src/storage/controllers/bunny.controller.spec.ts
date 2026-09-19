import { MemoryStoredFile } from 'nestjs-form-data';
import { BunnyController } from './bunny.controller';
import { BunnyService } from '../services/bunny.service';
import { UploadFileDto } from '../dtos/upload-file.dto';

describe('BunnyController', () => {
  let bunnyService: jest.Mocked<
    Pick<BunnyService, 'bunnyFileList' | 'getPresignedFile' | 'upload'>
  >;
  let controller: BunnyController;

  beforeEach(() => {
    bunnyService = {
      bunnyFileList: jest.fn(),
      getPresignedFile: jest.fn(),
      upload: jest.fn(),
    };
    controller = new BunnyController(bunnyService as unknown as BunnyService);
  });

  it('findAllFile returns the file list', async () => {
    bunnyService.bunnyFileList.mockResolvedValue([{ Key: 'a' }]);

    await expect(controller.findAllFile()).resolves.toEqual([{ Key: 'a' }]);
  });

  it('getPresignedFile presigns the test file', async () => {
    bunnyService.getPresignedFile.mockReturnValue('https://signed');

    await expect(controller.getPresignedFile()).resolves.toBe('https://signed');
    expect(bunnyService.getPresignedFile).toHaveBeenCalledWith('test.jpg');
  });

  it('getPresignedUploadFile resolves nothing', async () => {
    await expect(controller.getPresignedUploadFile()).resolves.toBeUndefined();
  });

  it('uploadFile uploads the given file', async () => {
    const file = { extension: 'png' } as unknown as MemoryStoredFile;
    const dto = { file } as unknown as UploadFileDto;
    bunnyService.upload.mockResolvedValue('key.png');

    await expect(controller.uploadFile(dto)).resolves.toBe('key.png');
    expect(bunnyService.upload).toHaveBeenCalledWith(file);
  });
});
