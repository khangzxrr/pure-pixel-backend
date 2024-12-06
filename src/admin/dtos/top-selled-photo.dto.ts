import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

export class TopSellingPhotoDto {
  @ApiProperty()
  @IsNumber()
  totalPhotoSold: number;

  @ApiProperty()
  @Type(() => SignedPhotoDto)
  photo: SignedPhotoDto;
}
