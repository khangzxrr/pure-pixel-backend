import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'src/authen/guards/ws.auth.guard';
import { NotificationGateway } from './notification.gateway';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });

    gateway = new NotificationGateway();
    (gateway as unknown as { server: Server }).server = {
      to,
    } as unknown as Server;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should join socket to room of its user id', async () => {
    const join = jest.fn();

    await gateway.joinEvent({
      id: 's1',
      user: { sub: 'u1' },
      join,
    } as unknown as AuthenticatedSocket);

    expect(join).toHaveBeenCalledWith('u1');
    expect(Logger.prototype.log).toHaveBeenCalled();
  });

  it('should emit refresh event to user room', async () => {
    const data = { title: 't' };

    await gateway.sendRefreshNotificationEvent('u1', data);

    expect(to).toHaveBeenCalledWith('u1');
    expect(emit).toHaveBeenCalledWith('notification-event', data);
  });
});
