import { ApiProperty } from '@nestjs/swagger';
import { IdResponseDto } from './id.response.dto';

export class ResponseBaseDto extends IdResponseDto {
  @ApiProperty({ example: '2020-11-24T17:43:15.970Z' })
  createdAt: Date;

  @ApiProperty({ example: '2020-11-24T17:43:15.970Z' })
  updatedAt: Date;
}
