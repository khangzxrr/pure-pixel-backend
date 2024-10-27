import { ApiProperty } from '@nestjs/swagger';

export class SharePhotoResponseDto {
  @ApiProperty()
  size: number;

  @ApiProperty()
  shareUrl: string;

  constructor(size: number, shareUrl: string) {
    this.shareUrl = shareUrl;
    this.size = size;
  }
}
