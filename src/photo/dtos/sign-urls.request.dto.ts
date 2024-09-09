import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

export class SignUrl {
  @ApiProperty()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsNotEmpty()
  thumbnail: string;
}
export class SignUrlsRequest {
  @ApiProperty({
    isArray: true,
    type: SignUrl,
  })
  @IsArray()
  @ArrayNotEmpty()
  signUrls: SignUrl[];
}
