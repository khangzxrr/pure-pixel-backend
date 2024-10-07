import { ApiProperty } from '@nestjs/swagger';
import { PhotoBuyResponseDto } from './photo-buy.response.dto';

export class SignedPhotoBuyDto extends PhotoBuyResponseDto {
  @ApiProperty()
  signedPhotoUrl: string;
}
