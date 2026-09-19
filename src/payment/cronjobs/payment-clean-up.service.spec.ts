import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { PaymentCleanUpCronJob } from './payment-clean-up.service';

describe('PaymentCleanUpCronJob', () => {
  const transactionRepository = { update: jest.fn() };
  const cron = new PaymentCleanUpCronJob(
    transactionRepository as unknown as TransactionRepository,
  );
  const now = new Date('2024-06-10T12:00:00.000Z');
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now });
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    logSpy.mockRestore();
  });

  it('should expire pending transactions older than 5 minutes and withdrawals older than 3 days', async () => {
    transactionRepository.update
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 });

    await cron.cleanupPendingTransaction();

    expect(transactionRepository.update).toHaveBeenNthCalledWith(
      1,
      {
        status: 'PENDING',
        type: { notIn: ['WITHDRAWAL'] },
        createdAt: { lte: new Date('2024-06-10T11:55:00.000Z') },
      },
      { status: 'EXPIRED' },
    );
    expect(transactionRepository.update).toHaveBeenNthCalledWith(
      2,
      {
        status: 'PENDING',
        type: 'WITHDRAWAL',
        createdAt: { lte: new Date('2024-06-07T12:00:00.000Z') },
      },
      { status: 'EXPIRED' },
    );
    expect(logSpy).toHaveBeenCalledWith('clean up 2 transactions');
    expect(logSpy).toHaveBeenCalledWith('clean up 1 withdrawals transactions');
  });

  it('should not log when nothing was cleaned up', async () => {
    transactionRepository.update.mockResolvedValue({ count: 0 });

    await cron.cleanupPendingTransaction();

    expect(transactionRepository.update).toHaveBeenCalledTimes(2);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
