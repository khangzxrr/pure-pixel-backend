import { Cache } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from 'src/authen/guards/ws.auth.guard';
import { PhotoGateway } from './photo.gateway';

describe('PhotoGateway', () => {
  let cacheManager: jest.Mocked<Pick<Cache, 'get' | 'set'>>;
  let emit: jest.Mock;
  let to: jest.Mock;
  let gateway: PhotoGateway;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    cacheManager = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });

    gateway = new PhotoGateway(cacheManager as unknown as Cache);
    (gateway as unknown as { server: Server }).server = {
      to,
    } as unknown as Server;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles connection and disconnection without side effects', () => {
    expect(gateway.handleConnection({} as Socket)).toBeUndefined();
    expect(gateway.handleDisconnect({} as Socket)).toBeUndefined();
  });

  it('logs when a socket joins the notification room', async () => {
    await gateway.joinEvent({
      id: 's1',
      user: { sub: 'u1' },
    } as AuthenticatedSocket);

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'socket: s1 with user id: u1 join',
    );
  });

  it('gets socket ids of a user from cache', async () => {
    const ids = new Set(['s1']);
    cacheManager.get.mockResolvedValue(ids);

    await expect(gateway.getSetOfSocketIdsByUserId('u1')).resolves.toBe(ids);
    expect(cacheManager.get).toHaveBeenCalledWith('u1');
  });

  describe('addSocketIdToSetByUserId', () => {
    it('creates a new set when none is cached', async () => {
      await gateway.addSocketIdToSetByUserId('u1', 's1');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'u1',
        new Set(['s1']),
        1000 * 60 * 60,
      );
    });

    it('adds to the existing cached set', async () => {
      cacheManager.get.mockResolvedValue(new Set(['s0']));

      await gateway.addSocketIdToSetByUserId('u1', 's1');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'u1',
        new Set(['s0', 's1']),
        1000 * 60 * 60,
      );
    });
  });

  describe.each([
    [
      'sendDataToUserId',
      (g: PhotoGateway) => g.sendDataToUserId('u1', 'custom-event', { a: 1 }),
      'custom-event',
    ],
    [
      'sendFinishWatermarkEventToUserId',
      (g: PhotoGateway) => g.sendFinishWatermarkEventToUserId('u1', { a: 1 }),
      'finish-watermark-photo',
    ],
    [
      'sendFinishProcessPhotoEventToUserId',
      (g: PhotoGateway) =>
        g.sendFinishProcessPhotoEventToUserId('u1', { a: 1 }),
      'finish-process-photos',
    ],
  ])('%s', (_name, send, event) => {
    it('does not emit when user has no sockets', async () => {
      await send(gateway);

      expect(to).not.toHaveBeenCalled();
    });

    it('emits event to all sockets of the user', async () => {
      cacheManager.get.mockResolvedValue(new Set(['s1', 's2']));

      await send(gateway);

      expect(to).toHaveBeenCalledWith(['s1', 's2']);
      expect(emit).toHaveBeenCalledWith(event, { a: 1 });
    });
  });
});
