import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

export class TopSellingPhotoDto {
  @ApiProperty()
  @IsNumber()
  totalSelled: number;

  @ApiProperty()
  @Type(() => SignedPhotoDto)
  photo: SignedPhotoDto;
}
