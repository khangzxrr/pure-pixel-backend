import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { UpgradeOrderService } from 'src/upgrade-order/services/upgrade-order.service';
import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { UserService } from '../services/user.service';
import { MeController } from './me.controller';

describe('MeController', () => {
  const user = { sub: 'u1' };
  let userService: { findMe: jest.Mock; updateProfile: jest.Mock };
  let upgradeOrderService: { findActiveUpgradePackageOrderByUserId: jest.Mock };
  let res: { status: jest.Mock; json: jest.Mock };
  let controller: MeController;

  beforeEach(() => {
    userService = { findMe: jest.fn(), updateProfile: jest.fn() };
    upgradeOrderService = { findActiveUpgradePackageOrderByUserId: jest.fn() };
    res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);

    controller = new MeController(
      userService as unknown as UserService,
      upgradeOrderService as unknown as UpgradeOrderService,
    );
  });

  it('getMeInfo returns the logged user info', async () => {
    const me = { id: 'u1' };
    userService.findMe.mockResolvedValue(me);

    await expect(controller.getMeInfo(user)).resolves.toBe(me);
    expect(userService.findMe).toHaveBeenCalledWith('u1');
  });

  it('patchUpdateProfile updates the logged user profile', async () => {
    const dto: UpdateProfileDto = { name: 'John' };
    const updated = { id: 'u1', name: 'John' };
    userService.updateProfile.mockResolvedValue(updated);

    await expect(controller.patchUpdateProfile(user, dto)).resolves.toBe(
      updated,
    );
    expect(userService.updateProfile).toHaveBeenCalledWith('u1', dto);
  });

  describe('getMeCurrentUpgradePackage', () => {
    it('responds 200 with the active upgrade order', async () => {
      const order = { id: 'order-1' };
      upgradeOrderService.findActiveUpgradePackageOrderByUserId.mockResolvedValue(
        order,
      );

      await expect(
        controller.getMeCurrentUpgradePackage(user, res as unknown as Response),
      ).resolves.toBeUndefined();

      expect(
        upgradeOrderService.findActiveUpgradePackageOrderByUserId,
      ).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(order);
    });

    it('responds 204 when there is no active upgrade order', async () => {
      upgradeOrderService.findActiveUpgradePackageOrderByUserId.mockResolvedValue(
        null,
      );

      await controller.getMeCurrentUpgradePackage(
        user,
        res as unknown as Response,
      );

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(res.json).toHaveBeenCalledWith({});
    });
  });
});
