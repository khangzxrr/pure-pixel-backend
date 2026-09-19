import { PrismaService } from './prisma.service';

type HookParams = {
  operation?: string;
  args: { where?: Record<string, unknown> };
  query: jest.Mock;
};
type Hook = (params: HookParams) => Promise<unknown>;
type ExtensionConfig = { query: Record<string, Record<string, Hook>> };

describe('PrismaService', () => {
  const extendedModels = {
    camera: { update: jest.fn(), updateMany: jest.fn() },
    photoshootPackage: { update: jest.fn() },
    upgradePackage: { update: jest.fn() },
    photo: { update: jest.fn() },
  };
  const $connect = jest.fn();
  const $extends = jest.fn();

  let service: PrismaService;
  let config: ExtensionConfig;

  const hook = (model: string, name: string): Hook => config.query[model][name];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    $extends.mockReturnValue(extendedModels);

    service = Object.create(PrismaService.prototype) as PrismaService;
    Object.defineProperty(service, '$connect', { value: $connect });
    Object.defineProperty(service, '$extends', { value: $extends });

    const result = service.extendedClient();

    expect(result).toBe(extendedModels);
    config = $extends.mock.calls[0][0] as ExtensionConfig;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('onModuleInit should connect', async () => {
    $connect.mockResolvedValue(undefined);

    await service.onModuleInit();

    expect($connect).toHaveBeenCalledTimes(1);
  });

  it('extendedClient should register query hooks for soft-deletable models', () => {
    expect(Object.keys(config.query)).toEqual([
      'camera',
      'photoshootPackage',
      'upgradePackage',
      'photo',
    ]);
  });

  describe('camera $allOperations', () => {
    it.each([
      'findFirst',
      'findMany',
      'findUnique',
      'findFirstOrThrow',
      'findUniqueOrThrow',
      'count',
      'update',
      'updateMany',
    ])('should add deletedAt null filter for %s', async (operation) => {
      const query = jest.fn().mockResolvedValue('result');
      const args = { where: { id: 'camera-1' } };

      await expect(
        hook('camera', '$allOperations')({ operation, args, query }),
      ).resolves.toBe('result');

      expect(query).toHaveBeenCalledWith({
        where: { id: 'camera-1', deletedAt: null },
      });
    });

    it('should soft delete on delete', async () => {
      const query = jest.fn();
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      extendedModels.camera.update.mockResolvedValue('updated');

      await expect(
        hook(
          'camera',
          '$allOperations',
        )({
          operation: 'delete',
          args: { where: { id: 'camera-1' } },
          query,
        }),
      ).resolves.toBe('updated');

      expect(extendedModels.camera.update).toHaveBeenCalledWith({
        where: { id: 'camera-1' },
        data: { deletedAt: new Date('2024-01-01T00:00:00.000Z') },
      });
      expect(query).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('should soft delete many on deleteMany', async () => {
      const query = jest.fn();
      extendedModels.camera.updateMany.mockResolvedValue({ count: 2 });

      await expect(
        hook(
          'camera',
          '$allOperations',
        )({
          operation: 'deleteMany',
          args: { where: { name: 'x' } },
          query,
        }),
      ).resolves.toEqual({ count: 2 });

      expect(extendedModels.camera.updateMany).toHaveBeenCalledWith({
        where: { name: 'x' },
        data: { deletedAt: new Date('2024-01-01T00:00:00.000Z') },
      });
      expect(query).not.toHaveBeenCalled();
    });

    it('should pass through other operations untouched', async () => {
      const query = jest.fn().mockResolvedValue('created');
      const args = { where: undefined };

      await expect(
        hook('camera', '$allOperations')({ operation: 'create', args, query }),
      ).resolves.toBe('created');

      expect(query).toHaveBeenCalledWith({ where: undefined });
    });
  });

  describe.each(['photoshootPackage', 'upgradePackage', 'photo'] as const)(
    '%s hooks',
    (model) => {
      it.each([
        'count',
        'findFirst',
        'findMany',
        'findUnique',
        'findFirstOrThrow',
        'findUniqueOrThrow',
        'update',
        'updateMany',
      ])('%s should add deletedAt null filter', async (name) => {
        const query = jest.fn().mockResolvedValue('result');

        await expect(
          hook(model, name)({ args: { where: { id: 'id-1' } }, query }),
        ).resolves.toBe('result');

        expect(query).toHaveBeenCalledWith({
          where: { id: 'id-1', deletedAt: null },
        });
      });

      it('delete should soft delete through update', async () => {
        const query = jest.fn();
        extendedModels[model].update.mockResolvedValue('soft-deleted');

        await expect(
          hook(model, 'delete')({ args: { where: { id: 'id-1' } }, query }),
        ).resolves.toBe('soft-deleted');

        expect(extendedModels[model].update).toHaveBeenCalledWith({
          where: { id: 'id-1' },
          data: { deletedAt: new Date('2024-01-01T00:00:00.000Z') },
        });
        expect(query).not.toHaveBeenCalled();
      });
    },
  );
});
