import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SharePhotoRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => {
    return Number(value);
  })
  quality: number;
}
