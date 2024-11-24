import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class PagingPaginatedRequestDto {
  @IsInt()
  @Min(0)
  @Max(9999)
  @ApiProperty({
    example: 10,
    description: 'total of records each page',
  })
  @Transform(({ value }) => {
    return Number(value);
  })
  readonly limit: number;

  @IsInt()
  @Min(0)
  @Max(9999)
  @ApiProperty({
    example: 0,
    description: 'Page number (start from 0)',
  })
  @Transform(({ value }) => {
    return Number(value);
  })
  readonly page: number;

  toSkip() {
    return this.page * this.limit;
  }
}
