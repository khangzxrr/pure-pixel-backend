import { ApiProperty } from '@nestjs/swagger';
import { IsIn, Min } from 'class-validator';
import { PhotoConstant } from '../constants/photo.constant';

export class PhotoResolution {
  @ApiProperty()
  @Min(1)
  pixels: number;

  @ApiProperty()
  @IsIn(PhotoConstant.SUPPORTED_RESOLUTION)
  resolution: string;
}
