import { Logger } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { StreamChat } from 'stream-chat';
import { ChatService } from './chat.service';

jest.mock('stream-chat', () => ({
  StreamChat: { getInstance: jest.fn() },
}));

const getInstanceMock = StreamChat.getInstance as unknown as jest.Mock;

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('ChatService', () => {
  const originalEnv = process.env;
  let userRepository: { findUnique: jest.Mock; findMany: jest.Mock };
  let notificationService: { addNotificationToQueue: jest.Mock };
  let stream: { upsertUser: jest.Mock; createToken: jest.Mock };
  let service: ChatService;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STREAM_ACCESS_KEY: 'stream-key',
      STREAM_SECRET_KEY: 'stream-secret',
    };

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    userRepository = { findUnique: jest.fn(), findMany: jest.fn() };
    notificationService = { addNotificationToQueue: jest.fn() };
    stream = {
      upsertUser: jest.fn().mockResolvedValue({ users: {} }),
      createToken: jest.fn(),
    };
    getInstanceMock.mockReset();
    getInstanceMock.mockReturnValue(stream);

    service = new ChatService(
      userRepository as unknown as UserRepository,
      notificationService as unknown as NotificationService,
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('processWebhook', () => {
    it('notifies other members for a new message', async () => {
      const notify = jest
        .spyOn(service, 'notifyToOtherUser')
        .mockResolvedValue(undefined);
      const data = { type: 'message.new' };

      await service.processWebhook(data);

      expect(notify).toHaveBeenCalledWith(data);
    });

    it('ignores other events', async () => {
      const notify = jest.spyOn(service, 'notifyToOtherUser');

      await service.processWebhook({ type: 'message.read' });

      expect(notify).not.toHaveBeenCalled();
    });
  });

  describe('notifyToOtherUser', () => {
    it('queues a chat notification for every member except the sender', async () => {
      userRepository.findUnique.mockResolvedValue({
        id: 'sender',
        name: 'John',
      });

      await service.notifyToOtherUser({
        message: { user: { id: 'sender' } },
        channel: {
          members: [{ user_id: 'sender' }, { user_id: 'a' }, { user_id: 'b' }],
        },
      });

      expect(userRepository.findUnique).toHaveBeenCalledWith('sender');
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledTimes(
        2,
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith({
        type: 'BOTH_INAPP_EMAIL',
        title: 'Có tin nhắn mới',
        content: 'Bạn vừa nhận được tin nhắn mới đến từ John',
        userId: 'a',
        payload: { id: 'sender' },
        referenceType: 'CHAT',
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'b' }),
      );
      expect(
        notificationService.addNotificationToQueue,
      ).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 'sender' }));
    });

    it('does not notify anyone when the sender is the only member', async () => {
      userRepository.findUnique.mockResolvedValue({
        id: 'sender',
        name: 'John',
      });

      await service.notifyToOtherUser({
        message: { user: { id: 'sender' } },
        channel: { members: [{ user_id: 'sender' }] },
      });

      expect(notificationService.addNotificationToQueue).not.toHaveBeenCalled();
    });
  });

  it('syncAllUsers upserts every user to stream and returns the count', async () => {
    userRepository.findMany.mockResolvedValue([
      { id: 'u1', name: 'A' },
      { id: 'u2', name: 'B' },
    ]);

    await expect(service.syncAllUsers()).resolves.toBe(2);
    await flushPromises();

    expect(userRepository.findMany).toHaveBeenCalledWith(
      {},
      [],
      {},
      0,
      Number.MAX_VALUE,
    );
    expect(getInstanceMock).toHaveBeenCalledWith('stream-key', 'stream-secret');
    expect(stream.upsertUser).toHaveBeenCalledWith({ id: 'u1', name: 'A' });
    expect(stream.upsertUser).toHaveBeenCalledWith({ id: 'u2', name: 'B' });
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'synced userId: u2 name: B',
    );
  });

  describe('upsertUser', () => {
    it('skips when stream chat is not configured', async () => {
      delete process.env.STREAM_ACCESS_KEY;

      await expect(service.upsertUser('u1', 'A', 'avatar')).resolves.toBeNull();
      expect(getInstanceMock).not.toHaveBeenCalled();
    });

    it('upserts the user with avatar', async () => {
      stream.upsertUser.mockResolvedValue({ users: { u1: {} } });

      await expect(
        service.upsertUser('u1', 'A', 'avatar.png'),
      ).resolves.toEqual({
        users: { u1: {} },
      });
      expect(stream.upsertUser).toHaveBeenCalledWith({
        id: 'u1',
        name: 'A',
        avatar: 'avatar.png',
      });
    });
  });

  it('signChatToken creates a stream token for the user', async () => {
    stream.createToken.mockReturnValue('token');

    await expect(service.signChatToken('u1')).resolves.toBe('token');
    expect(stream.createToken).toHaveBeenCalledWith('u1');
  });
});
