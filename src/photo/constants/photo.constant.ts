import { PhotoResolution } from '../dtos/photo-resolution.dto';

export class PhotoConstant {
  static PHOTO_PROCESS_QUEUE = 'PHOTO_PROCESS_QUEUE';
  static PHOTO_WATERMARK_QUEUE = 'PHOTO_WATERMARK_QUEUE';
  static PHOTO_SHARE_QUEUE = 'PHOTO_SHARE_QUEUE';

  static PROCESS_PHOTO_JOB_NAME = 'PROCESS_PHOTO_JOB_NAME';
  static GENERATE_SHARE_JOB_NAME = 'GENERATE_SHARE_JOB_NAME';

  static GENERATE_WATERMARK_JOB = 'GENERATE_WATERMARK_JOB';

  static WEBSOCKET_GATEWAY = 'PHOTO_GATEWAY';

  static THUMBNAIL_WIDTH = 400;

  static SUPPORTED_RESOLUTION = [
    '32K',
    '16K',
    '8K',
    '4K',
    '2K',
    '1080p',
    '720p',
    '480p',
  ];

  static PHOTO_RESOLUTION_MAP: PhotoResolution[] = [
    {
      pixels: 17280,
      resolution: '32K',
    },
    {
      pixels: 8640,
      resolution: '16K',
    },
    {
      pixels: 4320,
      resolution: '8K',
    },
    {
      pixels: 2160,
      resolution: '4K',
    },
    {
      pixels: 1440,
      resolution: '2K',
    },
    {
      pixels: 1080,
      resolution: '1080p',
    },
    {
      pixels: 720,
      resolution: '720p',
    },
    {
      pixels: 480,
      resolution: '480p',
    },
  ];
}
