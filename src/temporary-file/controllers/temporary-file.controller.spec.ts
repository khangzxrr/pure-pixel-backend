import { PassThrough } from 'stream';
import { Response } from 'express';
import { TemporaryfileService } from '../services/temporary-file.service';
import { TemporaryfileController } from './temporary-file.controller';

describe('TemporaryfileController', () => {
  let temporaryfileService: jest.Mocked<
    Pick<TemporaryfileService, 'pathToBuffer'>
  >;
  let controller: TemporaryfileController;

  beforeEach(() => {
    temporaryfileService = {
      pathToBuffer: jest.fn(),
    };

    controller = new TemporaryfileController(
      temporaryfileService as unknown as TemporaryfileService,
    );
  });

  it('should set jpeg content type and pipe buffer to response', async () => {
    const buffer = Buffer.from('jpeg-bytes');
    temporaryfileService.pathToBuffer.mockResolvedValue(buffer);

    const set = jest.fn();
    const res = Object.assign(new PassThrough(), { set });

    const chunks: Buffer[] = [];
    const finished = new Promise<void>((resolve) => {
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve());
    });

    await controller.getBufferFromfilename(
      '/tmp/purepixel-local-storage/a.jpg',
      res as unknown as Response,
    );

    await finished;

    expect(temporaryfileService.pathToBuffer).toHaveBeenCalledWith(
      '/tmp/purepixel-local-storage/a.jpg',
    );
    expect(set).toHaveBeenCalledWith({ 'Content-type': 'image/jpeg' });
    expect(Buffer.concat(chunks).toString()).toBe('jpeg-bytes');
  });

  it('should rethrow the original service error', async () => {
    const error = new Error('not found');
    temporaryfileService.pathToBuffer.mockRejectedValue(error);

    const set = jest.fn();

    await expect(
      controller.getBufferFromfilename('bad', {
        set,
      } as unknown as Response),
    ).rejects.toBe(error);
    expect(set).not.toHaveBeenCalled();
  });
});
