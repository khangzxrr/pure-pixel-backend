import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class PhotoVoteDto {
  @Exclude()
  userId: string;

  @Exclude()
  photoId: string;

  @ApiProperty()
  isUpvote: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
