import { PrismaPromise } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  const client = { $transaction: jest.fn() };
  const prisma = {
    extendedClient: jest.fn(() => client),
  } as unknown as PrismaService;

  it('applyTransactionMultipleQueries should run queries in a transaction', async () => {
    const queries = [
      Promise.resolve(1),
      Promise.resolve(2),
    ] as unknown as PrismaPromise<number>[];
    client.$transaction.mockResolvedValue([1, 2]);
    const service = new DatabaseService(prisma);

    await expect(
      service.applyTransactionMultipleQueries(queries),
    ).resolves.toEqual([1, 2]);

    const passed = client.$transaction.mock.calls[0][0];
    expect(passed).toEqual(queries);
    expect(passed).not.toBe(queries);
  });
});
