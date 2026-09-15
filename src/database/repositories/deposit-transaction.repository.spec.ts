import { PrismaService } from 'src/prisma.service';
import { DepositTransactionRepository } from './deposit-transaction.repository';

describe('DepositTransactionRepository', () => {
  it('create should create a pending deposit transaction', async () => {
    const transaction = { create: jest.fn().mockResolvedValue('created') };
    const repository = new DepositTransactionRepository({
      transaction,
    } as unknown as PrismaService);

    await expect(repository.create('user', 1000, 'SEPAY')).resolves.toBe(
      'created',
    );
    expect(transaction.create).toHaveBeenCalledWith({
      data: {
        user: { connect: { id: 'user' } },
        type: 'DEPOSIT',
        amount: 1000,
        status: 'PENDING',
        paymentMethod: 'SEPAY',
        paymentPayload: {},
        depositTransaction: { create: {} },
      },
    });
  });
});
