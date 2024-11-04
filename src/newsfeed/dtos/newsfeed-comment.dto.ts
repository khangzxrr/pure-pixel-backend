import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';

export class NewsfeedCommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => NewsfeedCommentDto)
  replies: NewsfeedCommentDto[];

  @Exclude()
  parentId: string;

  @Exclude()
  newsfeedId: string;

  @Exclude()
  userId: string;
}
