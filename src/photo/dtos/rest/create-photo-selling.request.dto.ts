import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreatePriceMapDto } from '../create-price-map.dto';

export class CreatePhotoSellingDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  description: string;

  @ApiProperty({
    required: true,
    isArray: true,
    type: CreatePriceMapDto,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @ValidateNested()
  @Type(() => CreatePriceMapDto)
  pricetags: CreatePriceMapDto[];
}
