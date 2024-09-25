import { ApiProperty } from '@nestjs/swagger';
import { PhotographerDTO } from './photographer.dto';

export class FollowingDto {
  @ApiProperty()
  photographer: PhotographerDTO;

  @ApiProperty()
  isFollowed: boolean;

  constructor(photographer: PhotographerDTO, isFollowed: boolean) {
    this.photographer = photographer;
    this.isFollowed = isFollowed;
  }
}
