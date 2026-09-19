import { ApiProperty } from '@nestjs/swagger';

export class ChatUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  avatar!: string;
}
