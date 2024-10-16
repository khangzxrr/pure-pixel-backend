import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PhotoshootPackageDetailCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    isArray: true,
  })
  @ValidateNested({})
  @IsString({})
  @IsNotEmpty()
  @ArrayMinSize(1)
  descriptions: string[];
}
