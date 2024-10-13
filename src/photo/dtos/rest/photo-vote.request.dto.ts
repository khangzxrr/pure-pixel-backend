import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PhotoVoteRequestDto {
  @ApiProperty()
  @IsBoolean()
  isUpvote: boolean;
}
