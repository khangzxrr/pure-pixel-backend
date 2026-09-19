import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChatRepository } from 'src/database/repositories/chat.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatService } from './chat.service';

const at = (iso: string) => new Date(iso);

const message = (id: string, senderId: string, createdAt: string) => ({
  id,
  conversationId: 'c1',
  senderId,
  content: `text ${id}`,
  createdAt: at(createdAt),
});

const messageDto = (id: string, senderId: string, createdAt: string) =>
  message(id, senderId, createdAt);

describe('ChatService', () => {
  let chatRepository: Record<keyof ChatRepository, jest.Mock>;
  let userRepository: { findUnique: jest.Mock };
  let notificationService: { addNotificationToQueue: jest.Mock };
  let chatGateway: { emitMessage: jest.Mock };
  let service: ChatService;

  const participants = [
    { conversationId: 'c1', userId: 'me', lastReadAt: at('2026-09-01T00:00:00Z') },
    { conversationId: 'c1', userId: 'bob', lastReadAt: at('2026-09-02T00:00:00Z') },
  ];

  beforeEach(() => {
    chatRepository = {
      findDirectConversation: jest.fn().mockResolvedValue(null),
      createDirectConversation: jest.fn(),
      findParticipants: jest.fn().mockResolvedValue(participants),
      findConversationsOfUser: jest.fn().mockResolvedValue([]),
      countUnreadMessages: jest.fn().mockResolvedValue(0),
      countAllUnreadMessages: jest.fn().mockResolvedValue(0),
      findMessages: jest.fn().mockResolvedValue([]),
      createMessage: jest.fn(),
      updateLastReadAt: jest.fn().mockResolvedValue(undefined),
    } as unknown as Record<keyof ChatRepository, jest.Mock>;
    userRepository = {
      findUnique: jest.fn(async (id: string) => ({
        id,
        name: id === 'me' ? 'Me Name' : 'Bob Name',
        avatar: `${id}.png`,
        mail: `${id}@mail.com`,
      })),
    };
    notificationService = { addNotificationToQueue: jest.fn() };
    chatGateway = { emitMessage: jest.fn() };

    service = new ChatService(
      chatRepository as unknown as ChatRepository,
      userRepository as unknown as UserRepository,
      notificationService as unknown as NotificationService,
      chatGateway as unknown as ChatGateway,
    );
  });

  describe('getOrCreateDirectConversation', () => {
    it('rejects chatting with yourself', async () => {
      await expect(
        service.getOrCreateDirectConversation('me', 'me'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(chatRepository.createDirectConversation).not.toHaveBeenCalled();
    });

    it('rejects an unknown user', async () => {
      userRepository.findUnique.mockResolvedValue(null);
      await expect(
        service.getOrCreateDirectConversation('me', 'ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the existing conversation for the sorted key', async () => {
      chatRepository.findDirectConversation.mockResolvedValue({ id: 'c1' });

      await expect(
        service.getOrCreateDirectConversation('zed', 'bob'),
      ).resolves.toEqual({
        id: 'c1',
        otherUser: { id: 'bob', name: 'Bob Name', avatar: 'bob.png' },
      });
      expect(chatRepository.findDirectConversation).toHaveBeenCalledWith('bob:zed');
      expect(chatRepository.createDirectConversation).not.toHaveBeenCalled();
    });

    it('uses the conversation a concurrent request created first', async () => {
      chatRepository.findDirectConversation
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'c3' });
      chatRepository.createDirectConversation.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.getOrCreateDirectConversation('me', 'bob'),
      ).resolves.toMatchObject({ id: 'c3' });
    });

    it('rethrows other errors while creating', async () => {
      chatRepository.createDirectConversation.mockRejectedValue(new Error('db down'));

      await expect(
        service.getOrCreateDirectConversation('me', 'bob'),
      ).rejects.toThrow('db down');
    });

    it('creates the conversation when none exists', async () => {
      chatRepository.createDirectConversation.mockResolvedValue({ id: 'c9' });

      const result = await service.getOrCreateDirectConversation('me', 'bob');

      expect(chatRepository.createDirectConversation).toHaveBeenCalledWith(
        'bob:me',
        ['me', 'bob'],
      );
      expect(result.id).toBe('c9');
    });
  });

  describe('listConversations', () => {
    it('maps each conversation for the current user and clamps take', async () => {
      chatRepository.findConversationsOfUser.mockResolvedValue([
        {
          id: 'c1',
          lastMessageAt: at('2026-09-03T00:00:00Z'),
          participants: [
            { ...participants[0], user: { id: 'me', name: 'Me Name', avatar: 'me.png' } },
            { ...participants[1], user: { id: 'bob', name: 'Bob Name', avatar: 'bob.png' } },
          ],
          messages: [message('m2', 'bob', '2026-09-03T00:00:00Z')],
        },
        {
          id: 'c2',
          lastMessageAt: at('2026-09-01T00:00:00Z'),
          participants: [
            { conversationId: 'c2', userId: 'ann', lastReadAt: at('2026-09-01T00:00:00Z'), user: { id: 'ann', name: 'Ann', avatar: 'ann.png' } },
            { conversationId: 'c2', userId: 'me', lastReadAt: at('2026-08-01T00:00:00Z'), user: { id: 'me', name: 'Me Name', avatar: 'me.png' } },
          ],
          messages: [],
        },
      ]);
      chatRepository.countUnreadMessages.mockImplementation(
        async (id: string) => (id === 'c1' ? 3 : 0),
      );

      const result = await service.listConversations('me', 5, 500);

      expect(chatRepository.findConversationsOfUser).toHaveBeenCalledWith('me', 5, 50);
      expect(chatRepository.countUnreadMessages).toHaveBeenCalledWith(
        'c1',
        'me',
        participants[0].lastReadAt,
      );
      expect(chatRepository.countUnreadMessages).toHaveBeenCalledWith(
        'c2',
        'me',
        at('2026-08-01T00:00:00Z'),
      );
      expect(result).toEqual([
        {
          id: 'c1',
          otherUser: { id: 'bob', name: 'Bob Name', avatar: 'bob.png' },
          lastMessage: messageDto('m2', 'bob', '2026-09-03T00:00:00Z'),
          unreadCount: 3,
          lastMessageAt: at('2026-09-03T00:00:00Z'),
        },
        {
          id: 'c2',
          otherUser: { id: 'ann', name: 'Ann', avatar: 'ann.png' },
          lastMessage: null,
          unreadCount: 0,
          lastMessageAt: at('2026-09-01T00:00:00Z'),
        },
      ]);
    });
  });

  describe('getMessages', () => {
    it('forbids non participants', async () => {
      await expect(service.getMessages('eve', 'c1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(chatRepository.findMessages).not.toHaveBeenCalled();
    });

    it('returns the page oldest first and clamps take', async () => {
      chatRepository.findMessages.mockResolvedValue([
        { ...message('m3', 'bob', '2026-09-03T00:00:00Z'), extra: 'x' },
        message('m2', 'me', '2026-09-02T00:00:00Z'),
      ]);
      const result = await service.getMessages('me', 'c1', 1000, 'm4');

      expect(chatRepository.findMessages).toHaveBeenCalledWith('c1', 100, 'm4');
      expect(result).toEqual([
        messageDto('m2', 'me', '2026-09-02T00:00:00Z'),
        messageDto('m3', 'bob', '2026-09-03T00:00:00Z'),
      ]);
    });

    it('defaults to 30 messages', async () => {
      await service.getMessages('me', 'c1');
      expect(chatRepository.findMessages).toHaveBeenCalledWith('c1', 30, undefined);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      chatRepository.createMessage.mockImplementation(
        async (conversationId: string, senderId: string, content: string) => ({
          id: 'm9',
          conversationId,
          senderId,
          content,
          createdAt: at('2026-09-05T00:00:00Z'),
        }),
      );
    });

    it('forbids non participants', async () => {
      await expect(service.sendMessage('eve', 'c1', 'hi')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(chatRepository.createMessage).not.toHaveBeenCalled();
    });

    it.each(['', '   ', 'x'.repeat(2001)])(
      'rejects invalid content %#',
      async (content) => {
        await expect(service.sendMessage('me', 'c1', content)).rejects.toBeInstanceOf(
          BadRequestException,
        );
        expect(chatRepository.createMessage).not.toHaveBeenCalled();
      },
    );

    it('stores trimmed content, pushes it to both users and notifies the other one', async () => {
      const result = await service.sendMessage('me', 'c1', '  hello  ');

      const dto = {
        id: 'm9',
        conversationId: 'c1',
        senderId: 'me',
        content: 'hello',
        createdAt: at('2026-09-05T00:00:00Z'),
      };
      expect(result).toEqual(dto);
      expect(chatRepository.createMessage).toHaveBeenCalledWith('c1', 'me', 'hello');
      expect(chatGateway.emitMessage).toHaveBeenCalledWith(
        expect.arrayContaining(['me', 'bob']),
        dto,
      );
      expect(chatGateway.emitMessage.mock.calls[0][0]).toHaveLength(2);
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledTimes(1);
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith({
        type: 'BOTH_INAPP_EMAIL',
        title: 'Có tin nhắn mới',
        content: 'Bạn vừa nhận được tin nhắn mới đến từ Me Name',
        userId: 'bob',
        payload: { id: 'me' },
        referenceType: 'CHAT',
      });
    });

    it('accepts exactly 2000 characters', async () => {
      await service.sendMessage('me', 'c1', 'x'.repeat(2000));
      expect(chatRepository.createMessage).toHaveBeenCalledWith('c1', 'me', 'x'.repeat(2000));
    });
  });

  describe('markAsRead', () => {
    it('forbids non participants', async () => {
      await expect(service.markAsRead('eve', 'c1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(chatRepository.updateLastReadAt).not.toHaveBeenCalled();
    });

    it('stores the current time as last read', async () => {
      const before = Date.now();
      await service.markAsRead('me', 'c1');

      const [conversationId, userId, readAt] = chatRepository.updateLastReadAt.mock.calls[0];
      expect([conversationId, userId]).toEqual(['c1', 'me']);
      expect(readAt).toBeInstanceOf(Date);
      expect(readAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  it('getUnreadCount wraps the repository count', async () => {
    chatRepository.countAllUnreadMessages.mockResolvedValue(7);
    await expect(service.getUnreadCount('me')).resolves.toEqual({ count: 7 });
    expect(chatRepository.countAllUnreadMessages).toHaveBeenCalledWith('me');
  });
});
