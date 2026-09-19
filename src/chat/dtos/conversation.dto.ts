import { ApiProperty } from '@nestjs/swagger';
import { ChatUserDto } from './chat-user.dto';
import { MessageDto } from './message.dto';

export class ConversationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: ChatUserDto })
  otherUser!: ChatUserDto;

  @ApiProperty({ type: MessageDto, nullable: true })
  lastMessage!: MessageDto | null;

  @ApiProperty()
  unreadCount!: number;

  @ApiProperty()
  lastMessageAt!: Date;
}
