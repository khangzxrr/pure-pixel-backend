import { ApiProperty } from '@nestjs/swagger';
import { PhotographerDTO } from './photographer.dto';

export class PhotographerProfileDto {
  @ApiProperty()
  photographer: PhotographerDTO;

  @ApiProperty()
  followersCount: number;

  @ApiProperty()
  followingsCount: number;

  @ApiProperty()
  upvoteCount: number;

  @ApiProperty()
  commentCount: number;
}
