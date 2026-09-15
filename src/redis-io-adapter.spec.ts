import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';
import { RedisIoAdapter } from './redis-io-adapter';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn(),
}));

describe('RedisIoAdapter', () => {
  const createClientMock = createClient as unknown as jest.Mock;
  const createAdapterMock = createAdapter as unknown as jest.Mock;

  const subClient = { connect: jest.fn() };
  const pubClient = {
    connect: jest.fn(),
    duplicate: jest.fn(() => subClient),
  };
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REDIS_URL = 'redis://localhost:6379';
    createClientMock.mockReturnValue(pubClient);
    pubClient.connect.mockResolvedValue(undefined);
    subClient.connect.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.REDIS_URL = originalRedisUrl;
    jest.restoreAllMocks();
  });

  it('connectToRedis should connect pub/sub clients and create the adapter', async () => {
    const adapterConstructor = jest.fn();
    createAdapterMock.mockReturnValue(adapterConstructor);
    const adapter = new RedisIoAdapter();

    await adapter.connectToRedis();

    expect(createClientMock).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(pubClient.duplicate).toHaveBeenCalled();
    expect(pubClient.connect).toHaveBeenCalled();
    expect(subClient.connect).toHaveBeenCalled();
    expect(createAdapterMock).toHaveBeenCalledWith(pubClient, subClient);
  });

  it('createIOServer should attach the redis adapter to the server', async () => {
    const adapterConstructor = jest.fn();
    createAdapterMock.mockReturnValue(adapterConstructor);
    const server = { adapter: jest.fn() };
    const superSpy = jest
      .spyOn(IoAdapter.prototype, 'createIOServer')
      .mockReturnValue(server as unknown as Server);
    const adapter = new RedisIoAdapter();
    await adapter.connectToRedis();

    const options = {
      path: '/socket',
    } as Partial<ServerOptions> as ServerOptions;
    const result = adapter.createIOServer(3000, options);

    expect(result).toBe(server);
    expect(superSpy).toHaveBeenCalledWith(3000, options);
    expect(server.adapter).toHaveBeenCalledWith(adapterConstructor);
  });
});
