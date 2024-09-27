import { ApiProperty } from '@nestjs/swagger';

export class SharePhotoResponseDto {
  @ApiProperty()
  shareQuality: string;

  constructor(shareQuality: string) {
    this.shareQuality = shareQuality;
  }
}
