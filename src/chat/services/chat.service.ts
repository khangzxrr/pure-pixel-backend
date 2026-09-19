import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message, Prisma } from '@prisma/client';
import { ChatRepository } from 'src/database/repositories/chat.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatUserDto } from '../dtos/chat-user.dto';
import { ConversationDto } from '../dtos/conversation.dto';
import { DirectConversationDto } from '../dtos/direct-conversation.dto';
import { MessageDto } from '../dtos/message.dto';
import { UnreadCountDto } from '../dtos/unread-count.dto';

const MAX_CONTENT_LENGTH = 2000;

@Injectable()
export class ChatService {
  constructor(
    @Inject() private readonly chatRepository: ChatRepository,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly notificationService: NotificationService,
    @Inject() private readonly chatGateway: ChatGateway,
  ) {}

  private toMessageDto(message: Message): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  private toChatUserDto(user: {
    id: string;
    name: string;
    avatar: string;
  }): ChatUserDto {
    return { id: user.id, name: user.name, avatar: user.avatar };
  }

  async getOrCreateDirectConversation(
    currentUserId: string,
    otherUserId: string,
  ): Promise<DirectConversationDto> {
    if (otherUserId === currentUserId) {
      throw new BadRequestException('Cannot chat with yourself');
    }

    const otherUser = await this.userRepository.findUnique(otherUserId);
    if (!otherUser) {
      throw new NotFoundException(`User ${otherUserId} not found`);
    }

    const directKey = [currentUserId, otherUserId].sort().join(':');

    let conversation =
      await this.chatRepository.findDirectConversation(directKey);

    if (!conversation) {
      try {
        conversation = await this.chatRepository.createDirectConversation(
          directKey,
          [currentUserId, otherUserId],
        );
      } catch (error) {
        //a concurrent request created it first (unique directKey): use that one
        const created =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
            ? await this.chatRepository.findDirectConversation(directKey)
            : null;
        if (!created) {
          throw error;
        }
        conversation = created;
      }
    }

    return {
      id: conversation.id,
      otherUser: this.toChatUserDto(otherUser),
    };
  }

  async listConversations(
    userId: string,
    skip: number,
    take: number,
  ): Promise<ConversationDto[]> {
    const clampedTake = Math.min(Math.max(take, 1), 50);

    const conversations = await this.chatRepository.findConversationsOfUser(
      userId,
      skip,
      clampedTake,
    );

    const result: ConversationDto[] = [];
    for (const conversation of conversations) {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId,
      )!;
      const myParticipant = conversation.participants.find(
        (p) => p.userId === userId,
      )!;

      const unreadCount = await this.chatRepository.countUnreadMessages(
        conversation.id,
        userId,
        myParticipant.lastReadAt,
      );

      result.push({
        id: conversation.id,
        otherUser: this.toChatUserDto(otherParticipant.user),
        lastMessage: conversation.messages[0]
          ? this.toMessageDto(conversation.messages[0])
          : null,
        unreadCount,
        lastMessageAt: conversation.lastMessageAt,
      });
    }

    return result;
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participants =
      await this.chatRepository.findParticipants(conversationId);

    if (!participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException(
        `User ${userId} is not a participant of conversation ${conversationId}`,
      );
    }

    return participants;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    take = 30,
    beforeId?: string,
  ): Promise<MessageDto[]> {
    await this.assertParticipant(conversationId, userId);

    const clampedTake = Math.min(Math.max(take, 1), 100);

    const messages = await this.chatRepository.findMessages(
      conversationId,
      clampedTake,
      beforeId,
    );

    return messages.reverse().map((message) => this.toMessageDto(message));
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
  ): Promise<MessageDto> {
    const participants = await this.assertParticipant(conversationId, userId);

    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException('Message content cannot be empty');
    }
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      throw new BadRequestException(
        `Message content cannot exceed ${MAX_CONTENT_LENGTH} characters`,
      );
    }

    const message = await this.chatRepository.createMessage(
      conversationId,
      userId,
      trimmed,
    );

    const dto = this.toMessageDto(message);

    const userIds = participants.map((p) => p.userId);
    this.chatGateway.emitMessage(userIds, dto);

    const sender = await this.userRepository.findUnique(userId);
    for (const participant of participants) {
      if (participant.userId !== userId) {
        this.notificationService.addNotificationToQueue({
          type: 'BOTH_INAPP_EMAIL',
          title: 'Có tin nhắn mới',
          content: `Bạn vừa nhận được tin nhắn mới đến từ ${sender?.name}`,
          userId: participant.userId,
          payload: { id: userId },
          referenceType: 'CHAT',
        });
      }
    }

    return dto;
  }

  async markAsRead(userId: string, conversationId: string): Promise<void> {
    await this.assertParticipant(conversationId, userId);

    await this.chatRepository.updateLastReadAt(
      conversationId,
      userId,
      new Date(),
    );
  }

  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const count = await this.chatRepository.countAllUnreadMessages(userId);
    return { count };
  }
}
