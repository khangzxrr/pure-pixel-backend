import { ApiProperty } from '@nestjs/swagger';

export class SharePhotoResponseDto {
  @ApiProperty()
  watermark: boolean;

  @ApiProperty()
  resolution: string;

  @ApiProperty()
  shareUrl: string;

  constructor(watermark: boolean, resolution: string, shareUrl: string) {
    this.shareUrl = shareUrl;
    this.watermark = watermark;
    this.resolution = resolution;
  }
}
