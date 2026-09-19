import { Cache } from '@nestjs/cache-manager';
import { CachingService } from './caching.service';

describe('CachingService', () => {
  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: { keys: jest.fn() },
  };
  let service: CachingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CachingService(cache as unknown as Cache);
  });

  it('get should return the cached value', async () => {
    cache.get.mockResolvedValue({ a: 1 });

    await expect(service.get<{ a: number }>('key')).resolves.toEqual({ a: 1 });
    expect(cache.get).toHaveBeenCalledWith('key');
  });

  it('set should store the value', async () => {
    cache.set.mockResolvedValue(undefined);

    await service.set('key', 'value');

    expect(cache.set).toHaveBeenCalledWith('key', 'value');
  });

  it('del should delete the key', async () => {
    cache.del.mockResolvedValue(undefined);

    await service.del('key');

    expect(cache.del).toHaveBeenCalledWith('key');
  });

  it('deleteWithPattern should delete every matching key', async () => {
    cache.store.keys.mockResolvedValue(['a', 'b']);
    cache.del.mockResolvedValue(undefined);

    await service.deleteWithPattern('prefix*');

    expect(cache.store.keys).toHaveBeenCalledWith('prefix*');
    expect(cache.del).toHaveBeenNthCalledWith(1, 'a');
    expect(cache.del).toHaveBeenNthCalledWith(2, 'b');
  });

  it('deleteWithPattern should do nothing when no keys match', async () => {
    cache.store.keys.mockResolvedValue([]);

    await service.deleteWithPattern('none*');

    expect(cache.del).not.toHaveBeenCalled();
  });
});
