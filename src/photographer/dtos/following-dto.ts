import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';

export class FollowDto {
  @ApiProperty()
  @Type(() => UserDto)
  follower: UserDto;

  @ApiProperty()
  @Type(() => UserDto)
  following: UserDto;
}
