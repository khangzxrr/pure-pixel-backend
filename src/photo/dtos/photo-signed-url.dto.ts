import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignedUrl {
  @ApiProperty()
  url: string;

  @ApiProperty()
  thumbnail: string;

  constructor(url: string, thumbnail: string) {
    this.url = url;
    this.thumbnail = thumbnail;
  }
}
