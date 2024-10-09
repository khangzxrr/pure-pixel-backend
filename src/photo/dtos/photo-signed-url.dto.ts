import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignedUrl {
  @ApiProperty()
  url: string;

  @ApiProperty()
  thumbnail: string;

  @ApiPropertyOptional()
  colorGradingWatermark?: string;

  constructor(url: string, thumbnail: string, colorGradingWatermark?: string) {
    this.url = url;
    this.thumbnail = thumbnail;
    this.colorGradingWatermark = colorGradingWatermark;
  }
}
