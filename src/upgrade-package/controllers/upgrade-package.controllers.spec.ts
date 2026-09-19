import { UpgradePackageService } from '../services/upgrade-package.service';
import { UpgradePackageController } from './upgrade-package.controller';
import { ManageUpgradePackageController } from './manage-upgrade-package.controller';
import { UpgradePackageFindAllDto } from '../dtos/rest/upgrade-package-find-all.request.dto';
import { CreateUpgradePackageDto } from '../dtos/rest/create-upgrade-package.request.dto';
import { PatchUpdateUpgradePackageDto } from '../dtos/rest/patch-update-upgrade-package.request.dto';
import { PutUpdateUpgradePackageDto } from '../dtos/rest/put-update-upgrade-package.request.dto';

describe('UpgradePackage controllers', () => {
  const upgradePackageService = {
    findAll: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replace: jest.fn(),
  };

  const upgradePackageController = new UpgradePackageController(
    upgradePackageService as unknown as UpgradePackageService,
  );
  const manageController = new ManageUpgradePackageController(
    upgradePackageService as unknown as UpgradePackageService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('UpgradePackageController.findAll should delegate to service', async () => {
    const dto = new UpgradePackageFindAllDto();
    upgradePackageService.findAll.mockResolvedValue('result');

    await expect(upgradePackageController.findAll(dto)).resolves.toBe('result');
    expect(upgradePackageService.findAll).toHaveBeenCalledWith(dto);
  });

  it('ManageUpgradePackageController.findAll should delegate to service', async () => {
    const dto = new UpgradePackageFindAllDto();
    upgradePackageService.findAll.mockResolvedValue('all');

    await expect(manageController.findAll(dto)).resolves.toBe('all');
    expect(upgradePackageService.findAll).toHaveBeenCalledWith(dto);
  });

  it('ManageUpgradePackageController.delete should delegate to service', async () => {
    upgradePackageService.delete.mockResolvedValue('deleted');

    await expect(manageController.delete('pkg-1')).resolves.toBe('deleted');
    expect(upgradePackageService.delete).toHaveBeenCalledWith('pkg-1');
  });

  it('ManageUpgradePackageController.createUpgradePackage should delegate to service', async () => {
    const dto = new CreateUpgradePackageDto();
    upgradePackageService.create.mockResolvedValue('created');

    await expect(manageController.createUpgradePackage(dto)).resolves.toBe(
      'created',
    );
    expect(upgradePackageService.create).toHaveBeenCalledWith(dto);
  });

  it('ManageUpgradePackageController.patchUpdatePackage should delegate to service', async () => {
    const dto = new PatchUpdateUpgradePackageDto();
    upgradePackageService.update.mockResolvedValue('patched');

    await expect(
      manageController.patchUpdatePackage('pkg-1', dto),
    ).resolves.toBe('patched');
    expect(upgradePackageService.update).toHaveBeenCalledWith('pkg-1', dto);
  });

  it('ManageUpgradePackageController.putUpdatePackage should delegate to service', async () => {
    const dto = new PutUpdateUpgradePackageDto();
    upgradePackageService.replace.mockResolvedValue('replaced');

    await expect(manageController.putUpdatePackage('pkg-1', dto)).resolves.toBe(
      'replaced',
    );
    expect(upgradePackageService.replace).toHaveBeenCalledWith('pkg-1', dto);
  });
});
