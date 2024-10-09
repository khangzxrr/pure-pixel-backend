import { BiMap } from '@rimbu/bimap';

export class PhotoConstant {
  static PHOTO_PROCESS_QUEUE = 'PHOTO_PROCESS_QUEUE';
  static PHOTO_WATERMARK_QUEUE = 'PHOTO_WATERMARK_QUEUE';
  static PHOTO_SHARE_QUEUE = 'PHOTO_SHARE_QUEUE';

  static PROCESS_PHOTO_JOB_NAME = 'PROCESS_PHOTO_JOB_NAME';
  static GENERATE_SHARE_JOB_NAME = 'GENERATE_SHARE_JOB_NAME';

  static GENERATE_WATERMARK_JOB = 'GENERATE_WATERMARK_JOB';

  static WEBSOCKET_GATEWAY = 'PHOTO_GATEWAY';

  static THUMBNAIL_WIDTH = 400;

  static MIN_PHOTO_SIZE = 4000000;

  static SUPPORTED_PHOTO_RESOLUTION = [
    '32K',
    '16K',
    '8K',
    '4K',
    '2K',
    '1080p',
    '720p',
    '480p',
  ];

  static PHOTO_RESOLUTION_BIMAP = BiMap.of(
    ['32K', 17280],
    ['16K', 8640],
    ['8K', 4320],
    ['4K', 2160],
    ['2K', 1440],
    ['1080p', 1080],
    ['720p', 720],
    ['480p', 480],
  );
}
