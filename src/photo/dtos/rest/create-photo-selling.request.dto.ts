import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { PriceMapDto } from '../price-map.dto';

export class CreatePhotoSellingDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  photoId: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    required: true,
    isArray: true,
    type: PriceMapDto,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => PriceMapDto)
  priceMaps: PriceMapDto[];
}
