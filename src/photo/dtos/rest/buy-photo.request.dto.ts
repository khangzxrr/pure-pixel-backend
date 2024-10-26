import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { PhotoConstant } from 'src/photo/constants/photo.constant';

export class BuyPhotoRequestDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  @IsNumber()
  @Min(PhotoConstant.MIN_PHOTO_WIDTH)
  size: number;
}
