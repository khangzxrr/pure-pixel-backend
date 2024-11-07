import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OrderByRequestDto {
  @ApiPropertyOptional({
    example: 'createdAt:desc,id:asc',
  })
  @IsOptional()
  @IsString()
  orderby?: string;
}
