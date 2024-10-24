import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

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
  @IsNumber()
  @Type(() => Number)
  @Min(10000)
  @Max(999999999)
  price: number;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
