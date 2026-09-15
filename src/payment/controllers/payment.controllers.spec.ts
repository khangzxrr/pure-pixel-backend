import { Request } from 'express';
import { MemoryStoredFile } from 'nestjs-form-data';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { TransactionService } from '../services/transaction.service';
import { SepayService } from '../services/sepay.service';
import { ManageTransactionController } from './manage-transaction.controller';
import { SepayController } from './sepay.controller';
import { TransactionController } from './transaction.controller';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { AcceptWithdrawalTransactionDto } from '../dtos/rest/accept-withdrawal-transaction.dto';
import { DenyWithdrawalTransactionDto } from '../dtos/rest/deny-withdrawal-transaction.dto';
import { SepayRequestDto } from '../dtos/sepay.request.dto';

describe('Payment controllers', () => {
  const transactionService = {
    findAll: jest.fn(),
    update: jest.fn(),
    acceptWithdrawal: jest.fn(),
    denyWithdrawal: jest.fn(),
    findById: jest.fn(),
    findByUserIdAndId: jest.fn(),
    generatePaymentUrl: jest.fn(),
  };
  const sepayService = { processTransaction: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('ManageTransactionController', () => {
    const controller = new ManageTransactionController(
      transactionService as unknown as TransactionService,
    );

    it('findAll should pass request url to service', async () => {
      const dto = new FindAllTransactionDto();
      transactionService.findAll.mockResolvedValue('page');

      await expect(
        controller.findAll(dto, {
          url: '/manager/transaction?orderByAmount=asc',
        } as unknown as Request),
      ).resolves.toBe('page');
      expect(transactionService.findAll).toHaveBeenCalledWith(
        dto,
        '/manager/transaction?orderByAmount=asc',
      );
    });

    it('update should delegate to service', async () => {
      transactionService.update.mockResolvedValue(undefined);

      await controller.update('tr-1', { status: 'SUCCESS' });

      expect(transactionService.update).toHaveBeenCalledWith('tr-1', {
        status: 'SUCCESS',
      });
    });

    it('acceptWithdrawal should delegate to service', async () => {
      const dto = new AcceptWithdrawalTransactionDto();
      dto.photo = new MemoryStoredFile();
      transactionService.acceptWithdrawal.mockResolvedValue('accepted');

      await expect(controller.acceptWithdrawal('tr-1', dto)).resolves.toBe(
        'accepted',
      );
      expect(transactionService.acceptWithdrawal).toHaveBeenCalledWith(
        'tr-1',
        dto,
      );
    });

    it('denyWithdrawal should delegate to service', async () => {
      const dto = Object.assign(new DenyWithdrawalTransactionDto(), {
        failReason: 'reason',
      });
      transactionService.denyWithdrawal.mockResolvedValue('denied');

      await expect(controller.denyWithdrawal('tr-1', dto)).resolves.toBe(
        'denied',
      );
      expect(transactionService.denyWithdrawal).toHaveBeenCalledWith(
        'tr-1',
        dto,
      );
    });

    it('findById should delegate to service', async () => {
      transactionService.findById.mockResolvedValue('transaction');

      await expect(controller.findById('tr-1')).resolves.toBe('transaction');
      expect(transactionService.findById).toHaveBeenCalledWith('tr-1');
    });
  });

  describe('TransactionController', () => {
    const controller = new TransactionController(
      transactionService as unknown as TransactionService,
    );
    const user = { sub: 'user-1' } as ParsedUserDto;

    it('getTransactionById should delegate to service with user id', async () => {
      transactionService.findByUserIdAndId.mockResolvedValue('transaction');

      await expect(controller.getTransactionById(user, 'tr-1')).resolves.toBe(
        'transaction',
      );
      expect(transactionService.findByUserIdAndId).toHaveBeenCalledWith(
        'user-1',
        'tr-1',
      );
    });

    it('generatePaymentUrl should delegate to service with user id', async () => {
      transactionService.generatePaymentUrl.mockResolvedValue('url');

      await expect(controller.generatePaymentUrl(user, 'tr-1')).resolves.toBe(
        'url',
      );
      expect(transactionService.generatePaymentUrl).toHaveBeenCalledWith(
        'user-1',
        'tr-1',
      );
    });
  });

  describe('SepayController', () => {
    const controller = new SepayController(
      sepayService as unknown as SepayService,
    );

    it('paymentWebhook should process sepay request', async () => {
      const dto = new SepayRequestDto();
      sepayService.processTransaction.mockResolvedValue(200);

      await expect(controller.paymentWebhook(dto)).resolves.toBe(200);
      expect(sepayService.processTransaction).toHaveBeenCalledWith(dto);
    });

    it('testWebhook should build mocked sepay request', async () => {
      sepayService.processTransaction.mockResolvedValue(200);

      await expect(controller.testWebhook('aa-bb-cc', 5000)).resolves.toBe(200);

      const request: SepayRequestDto =
        sepayService.processTransaction.mock.calls[0][0];
      expect(request).toBeInstanceOf(SepayRequestDto);
      expect(request.content).toBe('aa bb cc');
      expect(request.transferAmount).toBe(5000);
    });
  });
});
