import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class PhotoTagGetTopDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(999)
  top: number;
}
