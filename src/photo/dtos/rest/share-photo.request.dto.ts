import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { PhotoConstant } from 'src/photo/constants/photo.constant';

export class SharePhotoRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty()
  @IsNumber()
  @Min(PhotoConstant.MIN_PHOTO_WIDTH)
  size: number;
}
