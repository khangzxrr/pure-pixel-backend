import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/me.dto';

export class CommentDto {
  @ApiProperty()
  id: string;

  @Exclude()
  userId: string;

  @Exclude()
  parentId: string;

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => CommentDto)
  replies: CommentDto[];
}
