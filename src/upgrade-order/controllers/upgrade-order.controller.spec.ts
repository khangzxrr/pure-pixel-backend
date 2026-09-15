import { UpgradeOrderService } from '../services/upgrade-order.service';
import { UpgradeOrderController } from './upgrade-order.controller';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UpgradeTransferFeeRequestDto } from '../dtos/rest/upgrade-transfer-fee.request.dto';

describe('UpgradeOrderController', () => {
  const upgradeOrderService = {
    calculateTransferFee: jest.fn(),
    requestUpgradePayment: jest.fn(),
  };

  const controller = new UpgradeOrderController(
    upgradeOrderService as unknown as UpgradeOrderService,
  );

  const user = { sub: 'user-1' } as ParsedUserDto;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('checkTransferFee should delegate to service', async () => {
    const dto = Object.assign(new UpgradeTransferFeeRequestDto(), {
      totalMonths: 3,
    });
    upgradeOrderService.calculateTransferFee.mockResolvedValue('fee');

    await expect(controller.checkTransferFee(user, 'pkg-1', dto)).resolves.toBe(
      'fee',
    );
    expect(upgradeOrderService.calculateTransferFee).toHaveBeenCalledWith(
      'user-1',
      'pkg-1',
      dto,
    );
  });

  it('requestUpgradePayment should delegate to service', async () => {
    const dto = new RequestUpgradeDto();
    upgradeOrderService.requestUpgradePayment.mockResolvedValue('order');

    await expect(controller.requestUpgradePayment(user, dto)).resolves.toBe(
      'order',
    );
    expect(upgradeOrderService.requestUpgradePayment).toHaveBeenCalledWith(
      'user-1',
      dto,
    );
  });
});
