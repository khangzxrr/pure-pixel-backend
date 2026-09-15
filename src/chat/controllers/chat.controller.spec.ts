import { Request } from 'express';
import { ChatService } from '../services/chat.service';
import { ChatController } from './chat.controller';

describe('ChatController', () => {
  let chatService: {
    syncAllUsers: jest.Mock;
    signChatToken: jest.Mock;
    processWebhook: jest.Mock;
  };
  let controller: ChatController;

  beforeEach(() => {
    chatService = {
      syncAllUsers: jest.fn(),
      signChatToken: jest.fn(),
      processWebhook: jest.fn(),
    };
    controller = new ChatController(chatService as unknown as ChatService);
  });

  it('syncAllUser returns the synced user count', async () => {
    chatService.syncAllUsers.mockResolvedValue(3);

    await expect(controller.syncAllUser()).resolves.toBe(3);
  });

  it('authChatToken signs a token for the logged user', async () => {
    chatService.signChatToken.mockResolvedValue('token');

    await expect(controller.authChatToken({ sub: 'u1' })).resolves.toBe(
      'token',
    );
    expect(chatService.signChatToken).toHaveBeenCalledWith('u1');
  });

  it('webhookMessage processes the request body', async () => {
    const body = { type: 'message.new' };
    chatService.processWebhook.mockResolvedValue(undefined);

    await expect(
      controller.webhookMessage({ body } as Request),
    ).resolves.toBeUndefined();
    expect(chatService.processWebhook).toHaveBeenCalledWith(body);
  });
});
