import { Logger } from '@nestjs/common';
import { AuthenticatedSocket } from 'src/authen/guards/ws.auth.guard';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    gateway = new ChatGateway();
  });

  afterEach(() => jest.restoreAllMocks());

  it('joins the socket to the room of its user', async () => {
    const socket = { id: 's1', user: { sub: 'me' }, join: jest.fn() };

    await gateway.joinChat(socket as unknown as AuthenticatedSocket);

    expect(socket.join).toHaveBeenCalledWith('me');
  });

  it('pushes a message to the rooms of the given users', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    (gateway as unknown as { server: { to: jest.Mock } }).server = { to };
    const message = {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'me',
      content: 'hi',
      createdAt: new Date('2026-09-05T00:00:00Z'),
    };

    gateway.emitMessage(['me', 'bob'], message);

    expect(to).toHaveBeenCalledWith(['me', 'bob']);
    expect(emit).toHaveBeenCalledWith('chat-message', message);
  });
});
