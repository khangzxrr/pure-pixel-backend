import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { encode } from 'blurhash';
import exifr from 'exifr';
import { of } from 'rxjs';
import * as SharpLib from 'sharp';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoConstant } from '../constants/photo.constant';
import { FailToParsePhotoException } from '../exceptions/fail-to-parse-photo.exception';
import { FailedToGenerateThumbnailException } from '../exceptions/failed-to-generate-thumbnail.exception';
import { PhotoProcessService } from './photo-process.service';

jest.mock('sharp', () => jest.fn());
jest.mock('sharp-phash', () => jest.fn());
jest.mock('sharp-phash/distance', () => jest.fn());
jest.mock('exifr', () => ({ __esModule: true, default: { parse: jest.fn() } }));
jest.mock('blurhash', () => ({ encode: jest.fn(), decode: jest.fn() }));

const sharpFactory = SharpLib as unknown as jest.Mock;
const phash = jest.requireMock<jest.Mock>('sharp-phash');
const distance = jest.requireMock<jest.Mock>('sharp-phash/distance');
const exifrParse = exifr.parse as jest.Mock;
const encodeMock = encode as jest.Mock;

type SharpMock = Record<
  | 'clone'
  | 'withMetadata'
  | 'resize'
  | 'webp'
  | 'composite'
  | 'rotate'
  | 'jpeg'
  | 'raw'
  | 'ensureAlpha'
  | 'keepExif'
  | 'toBuffer'
  | 'metadata',
  jest.Mock
>;

const createSharp = (): SharpMock => {
  const sharp = {} as SharpMock;
  const chain = [
    'clone',
    'withMetadata',
    'resize',
    'webp',
    'composite',
    'rotate',
    'jpeg',
    'raw',
    'ensureAlpha',
    'keepExif',
  ] as const;
  chain.forEach((method) => {
    sharp[method] = jest.fn(() => sharp);
  });
  sharp.toBuffer = jest.fn().mockResolvedValue(Buffer.from('out'));
  sharp.metadata = jest.fn().mockResolvedValue({ width: 100, height: 50 });
  return sharp;
};

const asSharp = (sharp: SharpMock) => sharp as unknown as SharpLib.Sharp;

describe('PhotoProcessService', () => {
  let httpService: Record<'get', jest.Mock>;
  let bunnyService: Record<
    'getPresignedFile' | 'uploadFromBuffer' | 'download',
    jest.Mock
  >;
  let service: PhotoProcessService;
  const originalBackendOrigin = process.env.BACKEND_ORIGIN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BACKEND_ORIGIN = 'https://api.test';

    httpService = { get: jest.fn() };
    bunnyService = {
      getPresignedFile: jest.fn((key: string) => `signed:${key}`),
      uploadFromBuffer: jest.fn().mockResolvedValue('uploaded'),
      download: jest.fn().mockResolvedValue(Buffer.from('downloaded')),
    };
    service = new PhotoProcessService(
      httpService as unknown as HttpService,
      bunnyService as unknown as BunnyService,
    );
  });

  afterAll(() => {
    process.env.BACKEND_ORIGIN = originalBackendOrigin;
  });

  it('signs pending photo urls', () => {
    expect(service.signPendingPhoto('p1')).toEqual({
      url: 'https://api.test/photo/p1/temporary-photo',
      thumbnail: 'https://api.test/photo/p1/temporary-photo',
    });
  });

  it('signs pending watermark photo urls', () => {
    expect(service.signPendingWatermarkPhoto('p1')).toEqual({
      url: 'https://api.test/photo/p1/temporary-photo?watermark=true',
      thumbnail: 'https://api.test/photo/p1/temporary-photo?watermark=true',
    });
  });

  it('signs photo and its thumbnail', () => {
    expect(service.signPhoto('u1/p1.jpg', 'p1')).toEqual({
      url: 'signed:u1/p1.jpg',
      thumbnail: 'signed:thumbnail/p1.webp',
    });
  });

  it('signs watermark photo and its thumbnail', () => {
    expect(service.signWatermarkPhoto('watermark/u1/p1.jpg', 'p1')).toEqual({
      url: 'signed:watermark/u1/p1.jpg',
      thumbnail: 'signed:thumbnail/watermark/p1.webp',
    });
  });

  describe('isExistHash', () => {
    it('returns true when a hash is closer than threshold', () => {
      distance.mockReturnValueOnce(10).mockReturnValueOnce(4);

      expect(service.isExistHash('a', ['b', 'c'])).toBe(true);
      expect(distance).toHaveBeenCalledWith('a', 'c');
    });

    it('returns false when no hash is closer than threshold', () => {
      distance.mockReturnValue(5);

      expect(service.isExistHash('a', ['b', 'c'])).toBe(false);
    });

    it('uses a custom threshold', () => {
      distance.mockReturnValue(5);

      expect(service.isExistHash('a', ['b'], 6)).toBe(true);
    });
  });

  it('gets hash from buffer', async () => {
    phash.mockResolvedValue('hash');
    const buffer = Buffer.from('x');

    await expect(service.getHashFromBuffer(buffer)).resolves.toBe('hash');
    expect(phash).toHaveBeenCalledWith(buffer);
  });

  it('gets hash from storage key', async () => {
    phash.mockResolvedValue('hash');

    await expect(service.getHashFromKey('key')).resolves.toBe('hash');
    expect(bunnyService.download).toHaveBeenCalledWith('key');
    expect(phash).toHaveBeenCalledWith(Buffer.from('downloaded'));
  });

  it('uploads from buffer', async () => {
    const buffer = Buffer.from('x');

    await expect(service.uploadFromBuffer('key', buffer)).resolves.toBe(
      'uploaded',
    );
    expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith('key', buffer);
  });

  it('inits sharp from buffer', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);
    const buffer = Buffer.from('x');

    await expect(service.sharpInitFromBuffer(buffer)).resolves.toBe(sharp);
    expect(sharpFactory).toHaveBeenCalledWith(buffer);
  });

  it('inits sharp from file path ignoring pixel errors', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);

    await expect(service.sharpInitFromFilePath('/tmp/a.jpg')).resolves.toBe(
      sharp,
    );
    expect(sharpFactory).toHaveBeenCalledWith('/tmp/a.jpg', {
      failOnError: false,
    });
  });

  it('inits sharp from object key', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);

    await expect(service.sharpInitFromObjectKey('key')).resolves.toBe(sharp);
    expect(bunnyService.download).toHaveBeenCalledWith('key');
    expect(sharpFactory).toHaveBeenCalledWith(Buffer.from('downloaded'));
  });

  it('resizes with metadata', async () => {
    const sharp = createSharp();

    await expect(
      service.resizeWithMetadata(asSharp(sharp), 800),
    ).resolves.toEqual(Buffer.from('out'));
    expect(sharp.withMetadata).toHaveBeenCalled();
    expect(sharp.resize).toHaveBeenCalledWith({ width: 800 });
  });

  it('resizes without metadata', async () => {
    const sharp = createSharp();

    await expect(service.resize(asSharp(sharp), 600)).resolves.toEqual(
      Buffer.from('out'),
    );
    expect(sharp.clone).toHaveBeenCalled();
    expect(sharp.withMetadata).not.toHaveBeenCalled();
    expect(sharp.resize).toHaveBeenCalledWith({ width: 600 });
  });

  it('makes thumbnail', async () => {
    const sharp = createSharp();

    await service.makeThumbnail(asSharp(sharp));

    expect(sharp.withMetadata).toHaveBeenCalledWith({ exif: {} });
    expect(sharp.resize).toHaveBeenCalledWith(PhotoConstant.THUMBNAIL_WIDTH);
    expect(sharp.webp).toHaveBeenCalledWith({ quality: 70 });
    expect(sharp.toBuffer).toHaveBeenCalled();
  });

  it('makes thumbnail from buffer', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);

    await expect(
      service.thumbnailFromBuffer(Buffer.from('x')),
    ).resolves.toEqual(Buffer.from('out'));
    expect(sharp.webp).toHaveBeenCalled();
  });

  describe('getDisplaySize', () => {
    it('keeps the size of an upright photo', () => {
      expect(
        service.getDisplaySize({ width: 4032, height: 3024, orientation: 1 }),
      ).toEqual({ width: 4032, height: 3024 });
    });

    it('swaps the size of a quarter turned photo', () => {
      expect(
        service.getDisplaySize({ width: 4032, height: 3024, orientation: 6 }),
      ).toEqual({ width: 3024, height: 4032 });
    });

    it('keeps the size when there is no orientation', () => {
      expect(service.getDisplaySize({ width: 4032, height: 3024 })).toEqual({
        width: 4032,
        height: 3024,
      });
    });

    it('keeps a missing size missing', () => {
      expect(service.getDisplaySize({ orientation: 6 })).toEqual({
        width: undefined,
        height: undefined,
      });
    });
  });

  describe('makeWatermark', () => {
    it('composites a text svg scaled by width', async () => {
      const sharp = createSharp();
      sharp.metadata.mockResolvedValue({ width: 1000, height: 500 });

      await expect(service.makeWatermark(asSharp(sharp), 'PXL')).resolves.toBe(
        sharp,
      );

      const [[layers]] = sharp.composite.mock.calls;
      const svg = layers[0].input.toString();
      expect(svg).toContain('height="500" width="1000"');
      expect(svg).toContain('font-size="100"');
      expect(svg).toContain('>PXL</text>');
    });

    it('sizes the svg to the displayed photo for rotated photos', async () => {
      const sharp = createSharp();
      sharp.metadata.mockResolvedValue({
        width: 1000,
        height: 500,
        orientation: 6,
      });

      await service.makeWatermark(asSharp(sharp), 'PXL');

      expect(sharp.composite).toHaveBeenCalledTimes(1);
      const [[layers]] = sharp.composite.mock.calls;
      expect(layers[0].input.toString()).toContain('height="1000" width="500"');
    });

    it('rotates the photo before compositing', async () => {
      const sharp = createSharp();

      await service.makeWatermark(asSharp(sharp), 'PXL');

      expect(sharp.rotate).toHaveBeenCalled();
    });

    it('does not treat low orientation as rotated', async () => {
      const sharp = createSharp();
      sharp.metadata.mockResolvedValue({
        width: 1000,
        height: 500,
        orientation: 1,
      });

      await service.makeWatermark(asSharp(sharp), 'PXL');

      const [[layers]] = sharp.composite.mock.calls;
      expect(layers[0].input.toString()).toContain('height="500" width="1000"');
    });

    it('throws when width is missing', async () => {
      const sharp = createSharp();
      sharp.metadata.mockResolvedValue({ height: 500 });

      await expect(
        service.makeWatermark(asSharp(sharp), 'PXL'),
      ).rejects.toBeInstanceOf(FailToParsePhotoException);
    });

    it('throws when height is missing', async () => {
      const sharp = createSharp();
      sharp.metadata.mockResolvedValue({ width: 500 });

      await expect(
        service.makeWatermark(asSharp(sharp), 'PXL'),
      ).rejects.toBeInstanceOf(FailToParsePhotoException);
    });
  });

  it('makes text watermark buffer', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);

    await expect(
      service.makeTextWatermark(Buffer.from('x'), 'PXL'),
    ).resolves.toEqual(Buffer.from('out'));
    expect(sharp.composite).toHaveBeenCalled();
  });

  it('converts to jpeg', async () => {
    const sharp = createSharp();

    await expect(service.convertJpeg(asSharp(sharp))).resolves.toBe(sharp);
    expect(sharp.jpeg).toHaveBeenCalledWith({ quality: 100 });
  });

  it('parses xmp from buffer', async () => {
    exifrParse.mockResolvedValue({ xmp: 1 });
    const buffer = Buffer.from('x');

    await expect(service.parseXmpFromBuffer(buffer)).resolves.toEqual({
      xmp: 1,
    });
    expect(exifrParse).toHaveBeenCalledWith(buffer, { exif: false, xmp: true });
  });

  it('parses metadata from buffer', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);

    await expect(
      service.parseMetadataFromBuffer(Buffer.from('x')),
    ).resolves.toEqual({ width: 100, height: 50 });
  });

  it('parses metadata from file path', async () => {
    const sharp = createSharp();
    sharpFactory.mockReturnValue(sharp);

    await expect(
      service.parseMetadataFromFilePath('/tmp/a.jpg'),
    ).resolves.toEqual({ width: 100, height: 50 });
  });

  it('parses exif from file path', async () => {
    exifrParse.mockResolvedValue({ Make: 'Canon' });

    await expect(service.parseExifFromFilePath('/tmp/a.jpg')).resolves.toEqual({
      Make: 'Canon',
    });
    expect(exifrParse).toHaveBeenCalledWith('/tmp/a.jpg', {
      exif: true,
      xmp: false,
    });
  });

  it('parses exif from buffer', async () => {
    exifrParse.mockResolvedValue({ Make: 'Canon' });
    const buffer = Buffer.from('x');

    await expect(service.parseExifFromBuffer(buffer)).resolves.toEqual({
      Make: 'Canon',
    });
    expect(exifrParse).toHaveBeenCalledWith(buffer, { exif: true, xmp: false });
  });

  it('makes exif from sharp', async () => {
    const sharp = createSharp();
    exifrParse.mockResolvedValue({ Make: 'Canon' });

    await expect(service.makeExif(asSharp(sharp))).resolves.toEqual({
      Make: 'Canon',
    });
    expect(sharp.keepExif).toHaveBeenCalled();
    expect(exifrParse).toHaveBeenCalledWith(Buffer.from('out'), { exif: true });
  });

  describe('bufferToBlurhash', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('encodes a resized raw buffer to blurhash', async () => {
      const sharp = createSharp();
      sharpFactory.mockReturnValue(sharp);
      const raw = Buffer.from([1, 2, 3, 4]);
      sharp.toBuffer.mockImplementation(
        (
          callback: (
            err: Error | null,
            buffer: Buffer,
            info: { width: number; height: number },
          ) => void,
        ) => callback(null, raw, { width: 1, height: 1 }),
      );
      encodeMock.mockReturnValue('blurhash');

      await expect(service.bufferToBlurhash(Buffer.from('x'))).resolves.toBe(
        'blurhash',
      );
      expect(sharp.resize).toHaveBeenCalledWith(32, 32, { fit: 'inside' });
      expect(encodeMock).toHaveBeenCalledWith(
        new Uint8ClampedArray(raw),
        1,
        1,
        4,
        4,
      );
    });

    it('rejects when sharp fails', async () => {
      const sharp = createSharp();
      sharpFactory.mockReturnValue(sharp);
      const error = new Error('sharp');
      sharp.toBuffer.mockImplementation(
        (
          callback: (
            err: Error | null,
            buffer: Buffer,
            info: { width: number; height: number },
          ) => void,
        ) => callback(error, Buffer.alloc(0), { width: 0, height: 0 }),
      );

      await expect(service.bufferToBlurhash(Buffer.from('x'))).rejects.toBe(
        error,
      );
      expect(encodeMock).not.toHaveBeenCalled();
    });
  });

  it('gets buffer from key', async () => {
    await expect(service.getBufferFromKey('key')).resolves.toEqual(
      Buffer.from('downloaded'),
    );
  });

  describe('getBufferImageFromUrl', () => {
    it('returns data when response is ok', async () => {
      httpService.get.mockReturnValue(
        of({ status: 200, data: 'bytes' } as AxiosResponse),
      );

      await expect(service.getBufferImageFromUrl('http://x')).resolves.toBe(
        'bytes',
      );
      expect(httpService.get).toHaveBeenCalledWith('http://x', {
        responseType: 'arraybuffer',
      });
    });

    it('throws when response is not ok', async () => {
      httpService.get.mockReturnValue(
        of({ status: 404, data: null } as AxiosResponse),
      );

      await expect(
        service.getBufferImageFromUrl('http://x'),
      ).rejects.toBeInstanceOf(FailedToGenerateThumbnailException);
    });
  });
});
