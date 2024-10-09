import { ApiProperty } from '@nestjs/swagger';

export class SharePhotoResponseDto {
  @ApiProperty()
  resolution: string;

  @ApiProperty()
  shareUrl: string;

  constructor(resolution: string, shareUrl: string) {
    this.shareUrl = shareUrl;
    this.resolution = resolution;
  }
}
