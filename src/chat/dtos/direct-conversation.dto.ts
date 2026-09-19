import { ApiProperty } from '@nestjs/swagger';
import { ChatUserDto } from './chat-user.dto';

export class DirectConversationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: ChatUserDto })
  otherUser!: ChatUserDto;
}
