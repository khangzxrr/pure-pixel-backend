import { ApiProperty } from '@nestjs/swagger';

export class SignedUrl {
  @ApiProperty()
  url: string;

  @ApiProperty()
  thumbnail: string;

  constructor(url, thumbnail) {
    this.url = url;
    this.thumbnail = thumbnail;
  }
}
