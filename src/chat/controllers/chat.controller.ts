import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard, Public, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ChatService } from '../services/chat.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CreateConversationRequestDto } from '../dtos/create-conversation.request.dto';
import { ConversationListQueryDto } from '../dtos/conversation-list.query.dto';
import { MessageListQueryDto } from '../dtos/message-list.query.dto';
import { SendMessageRequestDto } from '../dtos/send-message.request.dto';

const CHAT_ROLES = {
  roles: [
    Constants.PHOTOGRAPHER_ROLE,
    Constants.CUSTOMER_ROLE,
    Constants.MANAGER_ROLE,
    Constants.ADMIN_ROLE,
  ],
};

@Controller('chat')
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles(CHAT_ROLES)
@Public(false)
export class ChatController {
  constructor(@Inject() private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'get or create a direct conversation with another user' })
  async createConversation(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() body: CreateConversationRequestDto,
  ) {
    return await this.chatService.getOrCreateDirectConversation(
      user.sub,
      body.userId,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'list conversations of the current user' })
  async listConversations(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() query: ConversationListQueryDto,
  ) {
    return await this.chatService.listConversations(
      user.sub,
      query.skip ?? 0,
      query.take ?? 20,
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'get messages of a conversation, paginated' })
  async getMessages(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Query() query: MessageListQueryDto,
  ) {
    return await this.chatService.getMessages(
      user.sub,
      id,
      query.take ?? 30,
      query.beforeId,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'send a message to a conversation' })
  async sendMessage(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
    @Body() body: SendMessageRequestDto,
  ) {
    return await this.chatService.sendMessage(user.sub, id, body.content);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'mark a conversation as read' })
  async markAsRead(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.chatService.markAsRead(user.sub, id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'get the total unread message count of the current user' })
  async getUnreadCount(@AuthenticatedUser() user: ParsedUserDto) {
    return await this.chatService.getUnreadCount(user.sub);
  }
}
