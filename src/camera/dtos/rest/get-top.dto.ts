import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class GetTopDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  top: number;
}
