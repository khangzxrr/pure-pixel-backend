import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ChatService } from '../services/chat.service';
import { ChatController } from './chat.controller';

describe('ChatController', () => {
  const user = { sub: 'me' } as ParsedUserDto;
  let chatService: Record<string, jest.Mock>;
  let controller: ChatController;

  beforeEach(() => {
    chatService = {
      getOrCreateDirectConversation: jest.fn().mockResolvedValue('conversation'),
      listConversations: jest.fn().mockResolvedValue('list'),
      getMessages: jest.fn().mockResolvedValue('messages'),
      sendMessage: jest.fn().mockResolvedValue('message'),
      markAsRead: jest.fn().mockResolvedValue(undefined),
      getUnreadCount: jest.fn().mockResolvedValue({ count: 2 }),
    };
    controller = new ChatController(chatService as unknown as ChatService);
  });

  it('creates or opens a conversation with the requested user', async () => {
    await expect(
      controller.createConversation(user, { userId: 'bob' }),
    ).resolves.toBe('conversation');
    expect(chatService.getOrCreateDirectConversation).toHaveBeenCalledWith('me', 'bob');
  });

  it('lists conversations with paging defaults', async () => {
    await expect(controller.listConversations(user, {})).resolves.toBe('list');
    expect(chatService.listConversations).toHaveBeenCalledWith('me', 0, 20);

    await controller.listConversations(user, { skip: 20, take: 10 });
    expect(chatService.listConversations).toHaveBeenLastCalledWith('me', 20, 10);
  });

  it('reads messages with an optional beforeId cursor', async () => {
    await expect(controller.getMessages(user, 'c1', {})).resolves.toBe('messages');
    expect(chatService.getMessages).toHaveBeenCalledWith('me', 'c1', 30, undefined);

    await controller.getMessages(user, 'c1', { take: 10, beforeId: 'm4' });
    expect(chatService.getMessages).toHaveBeenLastCalledWith('me', 'c1', 10, 'm4');
  });

  it('sends a message', async () => {
    await expect(
      controller.sendMessage(user, 'c1', { content: 'hi' }),
    ).resolves.toBe('message');
    expect(chatService.sendMessage).toHaveBeenCalledWith('me', 'c1', 'hi');
  });

  it('marks a conversation as read', async () => {
    await controller.markAsRead(user, 'c1');
    expect(chatService.markAsRead).toHaveBeenCalledWith('me', 'c1');
  });

  it('returns the unread count', async () => {
    await expect(controller.getUnreadCount(user)).resolves.toEqual({ count: 2 });
    expect(chatService.getUnreadCount).toHaveBeenCalledWith('me');
  });
});
