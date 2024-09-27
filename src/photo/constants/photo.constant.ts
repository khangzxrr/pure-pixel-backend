export class PhotoConstant {
  static PHOTO_PROCESS_QUEUE = 'PHOTO_PROCESS_QUEUE';

  static PROCESS_PHOTO_JOB_NAME = 'PROCESS_PHOTO_JOB_NAME';

  static GENERATE_WATERMARK_JOB = 'GENERATE_WATERMARK_JOB';

  static WEBSOCKET_GATEWAY = 'PHOTO_GATEWAY';

  static THUMBNAIL_WIDTH = 400;

  static PHOTO_RESOLUTION_MAP = [
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
