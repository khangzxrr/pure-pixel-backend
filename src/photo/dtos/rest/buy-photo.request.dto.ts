import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PhotoConstant } from 'src/photo/constants/photo.constant';

export class BuyPhotoRequestDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  @IsIn(PhotoConstant.SUPPORTED_RESOLUTION)
  resolution: string;
}
