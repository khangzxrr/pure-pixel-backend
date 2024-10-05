import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateWatermarkRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  text: string;
}
