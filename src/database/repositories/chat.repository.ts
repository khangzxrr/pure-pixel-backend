import { Injectable } from '@nestjs/common';
import {
  Conversation,
  ConversationParticipant,
  Message,
  User,
} from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

export type ConversationWithDetails = Conversation & {
  participants: (ConversationParticipant & {
    user: Pick<User, 'id' | 'name' | 'avatar'>;
  })[];
  messages: Message[]; // only the newest message (0 or 1 element)
};

@Injectable()
export class ChatRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findDirectConversation(directKey: string): Promise<Conversation | null> {
    return this.prismaService.conversation.findUnique({
      where: { directKey },
    });
  }

  createDirectConversation(
    directKey: string,
    userIds: [string, string],
  ): Promise<Conversation> {
    return this.prismaService.conversation.create({
      data: {
        directKey,
        participants: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
    });
  }

  findParticipants(
    conversationId: string,
  ): Promise<ConversationParticipant[]> {
    return this.prismaService.conversationParticipant.findMany({
      where: { conversationId },
    });
  }

  findConversationsOfUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<ConversationWithDetails[]> {
    return this.prismaService.conversation.findMany({
      where: {
        participants: { some: { userId } },
        messages: { some: {} },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  countUnreadMessages(
    conversationId: string,
    userId: string,
    after: Date,
  ): Promise<number> {
    return this.prismaService.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        createdAt: { gt: after },
      },
    });
  }

  async countAllUnreadMessages(userId: string): Promise<number> {
    const participants = await this.prismaService.conversationParticipant.findMany({
      where: { userId },
    });

    let total = 0;
    for (const participant of participants) {
      total += await this.countUnreadMessages(
        participant.conversationId,
        userId,
        participant.lastReadAt,
      );
    }

    return total;
  }

  //newest first; with beforeId only the messages older than that message.
  //id breaks ties between messages created in the same millisecond, so paging never skips one
  findMessages(
    conversationId: string,
    take: number,
    beforeId?: string,
  ): Promise<Message[]> {
    return this.prismaService.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(beforeId ? { cursor: { id: beforeId }, skip: 1 } : {}),
    });
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    return this.prismaService.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, senderId, content },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });

      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: senderId } },
        data: { lastReadAt: message.createdAt },
      });

      return message;
    });
  }

  updateLastReadAt(
    conversationId: string,
    userId: string,
    at: Date,
  ): Promise<unknown> {
    return this.prismaService.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: at },
    });
  }
}
