import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUrl, Min } from 'class-validator';
import { PhotoshootPackageDetailCreateDto } from './photoshoot-package-detail.create.request.dto';
import { Type } from 'class-transformer';

export class PhotoshootPackageCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  thumbnail: string;

  @ApiProperty()
  @IsNumber()
  @Min(10000)
  price: number;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PhotoshootPackageDetailCreateDto)
  details: PhotoshootPackageDetailCreateDto[];
}
