import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreatePhotoSellingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  photoId: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  afterPhotoUrl: string;

  @ApiProperty()
  @IsNumber()
  @Min(10000)
  @Max(99999999999)
  price: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
