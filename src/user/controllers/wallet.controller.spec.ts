import { Request } from 'express';
import { FindAllTransactionDto } from 'src/payment/dtos/rest/find-all-transaction.dto';
import { SepayService } from 'src/payment/services/sepay.service';
import { CreateDepositRequestDto } from '../dtos/rest/create-deposit.request.dto';
import { CreateWithdrawalRequestDto } from '../dtos/rest/create-withdrawal.request.dto';
import { WalletController } from './wallet.controller';

describe('WalletController', () => {
  const user = { sub: 'u1' };
  let sepayService: {
    getWalletByUserId: jest.Mock;
    createWithdrawal: jest.Mock;
    createDeposit: jest.Mock;
    findAllTransactionByUserId: jest.Mock;
  };
  let controller: WalletController;

  beforeEach(() => {
    sepayService = {
      getWalletByUserId: jest.fn(),
      createWithdrawal: jest.fn(),
      createDeposit: jest.fn(),
      findAllTransactionByUserId: jest.fn(),
    };
    controller = new WalletController(sepayService as unknown as SepayService);
  });

  it('getWallet returns the wallet of the logged user', async () => {
    sepayService.getWalletByUserId.mockResolvedValue({ walletBalance: 10 });

    await expect(controller.getWallet(user)).resolves.toEqual({
      walletBalance: 10,
    });
    expect(sepayService.getWalletByUserId).toHaveBeenCalledWith('u1');
  });

  it('createWithdrawal creates a withdrawal for the logged user', async () => {
    const dto = { amount: 100 } as unknown as CreateWithdrawalRequestDto;
    sepayService.createWithdrawal.mockResolvedValue({ id: 'w1' });

    await expect(controller.createWithdrawal(user, dto)).resolves.toEqual({
      id: 'w1',
    });
    expect(sepayService.createWithdrawal).toHaveBeenCalledWith('u1', dto);
  });

  it('createDeposit creates a deposit for the logged user', async () => {
    const dto = { amount: 100 } as unknown as CreateDepositRequestDto;
    sepayService.createDeposit.mockResolvedValue({ id: 'd1' });

    await expect(controller.createDeposit(user, dto)).resolves.toEqual({
      id: 'd1',
    });
    expect(sepayService.createDeposit).toHaveBeenCalledWith('u1', dto);
  });

  it('getTransactions lists transactions with the request url', async () => {
    const dto = {} as FindAllTransactionDto;
    const req = { url: '/wallet/transaction?page=0' } as Request;
    sepayService.findAllTransactionByUserId.mockResolvedValue({ objects: [] });

    await expect(controller.getTransactions(user, dto, req)).resolves.toEqual({
      objects: [],
    });
    expect(sepayService.findAllTransactionByUserId).toHaveBeenCalledWith(
      'u1',
      dto,
      '/wallet/transaction?page=0',
    );
  });
});
