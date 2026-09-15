import { PhotoshootPackageService } from '../services/photoshoot-package.service';
import { ManagePhotoshootPackageService } from '../services/manage-photoshoot-package.service';
import { ManagerPhotoShootPackageController } from './manager-photoshoot-package.controller';
import { PhotographerPhotoShootPackageController } from './photographer-photoshoot-package.controller';
import { PhotographerPhotoshootPackageShowCaseController } from './photographer-photoshoot-package-showcase.controller';
import { PhotoShootPackageController } from './photoshoot-package.controller';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';
import { PhotoshootPackageUpdateRequestDto } from '../dtos/rest/photoshoot-package-update.request.dto';
import { PhotoshootPackageReplaceRequestDto } from '../dtos/rest/photoshoot-package-replace.request.dto';
import { PhotoshootPackageCreateRequestDto } from '../dtos/rest/photoshoot-package-create.request.dto';
import { FileSystemPhotoshootPackageCreateRequestDto } from '../dtos/rest/file-system-photoshoot-package-create.request.dto';
import { PhotoshootPackageShowcaseFindAllDto } from '../dtos/rest/photoshoot-package-showcase.find-all.request.dto';
import { PhotoshootPackageShowcaseUpdateDto } from '../dtos/rest/photoshoot-package-showcase.update.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

const user = { sub: 'user-id' } as unknown as ParsedUserDto;
const findAllDto = new PhotoshootPackageFindAllDto();
const updateDto = { title: 'title' } as PhotoshootPackageUpdateRequestDto;
const replaceDto = {
  title: 'title',
} as unknown as PhotoshootPackageReplaceRequestDto;

describe('ManagerPhotoShootPackageController', () => {
  const service = {
    enable: jest.fn().mockResolvedValue(true),
    disable: jest.fn().mockResolvedValue(true),
    findAll: jest.fn().mockResolvedValue('findAll'),
    getById: jest.fn().mockResolvedValue('getById'),
    findAllByUserId: jest.fn().mockResolvedValue('findAllByUserId'),
    update: jest.fn().mockResolvedValue('update'),
    replace: jest.fn().mockResolvedValue('replace'),
    delete: jest.fn().mockResolvedValue('delete'),
  };
  const controller = new ManagerPhotoShootPackageController(
    service as unknown as ManagePhotoshootPackageService,
  );

  it('enables a package', async () => {
    await expect(controller.enablePhotoshootPackage('id')).resolves.toBe(true);
    expect(service.enable).toHaveBeenCalledWith('id');
  });

  it('disables a package', async () => {
    await expect(controller.disablePhotoshootPackage('id')).resolves.toBe(true);
    expect(service.disable).toHaveBeenCalledWith('id');
  });

  it('finds all packages', async () => {
    await expect(controller.findAllPhotoshootPackage(findAllDto)).resolves.toBe(
      'findAll',
    );
    expect(service.findAll).toHaveBeenCalledWith(findAllDto);
  });

  it('finds a package by id', async () => {
    await expect(controller.findPhotoshootPackageById('id')).resolves.toBe(
      'getById',
    );
    expect(service.getById).toHaveBeenCalledWith('id');
  });

  it('finds all packages by photographer', async () => {
    await expect(
      controller.findAllByPhotographer('photographer-id', findAllDto),
    ).resolves.toBe('findAllByUserId');
    expect(service.findAllByUserId).toHaveBeenCalledWith(
      'photographer-id',
      findAllDto,
    );
  });

  it('updates a package', async () => {
    await expect(controller.updatePhotoshoot(updateDto, 'id')).resolves.toBe(
      'update',
    );
    expect(service.update).toHaveBeenCalledWith('id', updateDto);
  });

  it('replaces a package', async () => {
    await expect(controller.replacePhotoshoot(replaceDto, 'id')).resolves.toBe(
      'replace',
    );
    expect(service.replace).toHaveBeenCalledWith('id', replaceDto);
  });

  it('deletes a package', async () => {
    await expect(controller.deletePhotoshootPackage('id')).resolves.toBe(
      'delete',
    );
    expect(service.delete).toHaveBeenCalledWith('id');
  });
});

describe('PhotographerPhotoShootPackageController', () => {
  const service = {
    getById: jest.fn().mockResolvedValue('getById'),
    findAllByUserId: jest.fn().mockResolvedValue('findAllByUserId'),
    create: jest.fn().mockResolvedValue('create'),
    filesystemCreate: jest.fn().mockResolvedValue('filesystemCreate'),
    update: jest.fn().mockResolvedValue('update'),
    replace: jest.fn().mockResolvedValue('replace'),
    delete: jest.fn().mockResolvedValue('delete'),
  };
  const controller = new PhotographerPhotoShootPackageController(
    service as unknown as PhotoshootPackageService,
  );

  it('finds a package by id', async () => {
    await expect(controller.findPhotoshootPackageById('id')).resolves.toBe(
      'getById',
    );
    expect(service.getById).toHaveBeenCalledWith('id');
  });

  it('finds all packages of current photographer', async () => {
    await expect(
      controller.findAllByPhotographer(user, findAllDto),
    ).resolves.toBe('findAllByUserId');
    expect(service.findAllByUserId).toHaveBeenCalledWith('user-id', findAllDto);
  });

  it('creates a package', async () => {
    const createDto = {
      title: 'title',
    } as unknown as PhotoshootPackageCreateRequestDto;

    await expect(controller.create(user, createDto)).resolves.toBe('create');
    expect(service.create).toHaveBeenCalledWith('user-id', createDto);
  });

  it('creates a package with filesystem upload', async () => {
    const createDto = {
      title: 'title',
    } as unknown as FileSystemPhotoshootPackageCreateRequestDto;

    await expect(
      controller.createWithFileSystemUpload(user, createDto),
    ).resolves.toBe('filesystemCreate');
    expect(service.filesystemCreate).toHaveBeenCalledWith('user-id', createDto);
  });

  it('updates a package', async () => {
    await expect(
      controller.updatePhotoshoot(user, updateDto, 'id'),
    ).resolves.toBe('update');
    expect(service.update).toHaveBeenCalledWith('user-id', 'id', updateDto);
  });

  it('replaces a package', async () => {
    await expect(
      controller.replacePhotoshoot(user, replaceDto, 'id'),
    ).resolves.toBe('replace');
    expect(service.replace).toHaveBeenCalledWith('user-id', 'id', replaceDto);
  });

  it('deletes a package', async () => {
    await expect(controller.deletePhotoshootPackage(user, 'id')).resolves.toBe(
      'delete',
    );
    expect(service.delete).toHaveBeenCalledWith('user-id', 'id');
  });
});

describe('PhotographerPhotoshootPackageShowCaseController', () => {
  const service = {
    findAllShowcase: jest.fn().mockResolvedValue('findAllShowcase'),
    createShowcase: jest.fn().mockResolvedValue('createShowcase'),
    replaceShowcase: jest.fn().mockResolvedValue('replaceShowcase'),
    deleteShowcase: jest.fn().mockResolvedValue(true),
  };
  const controller = new PhotographerPhotoshootPackageShowCaseController(
    service as unknown as PhotoshootPackageService,
  );
  const showcaseDto = {
    showcase: {},
  } as unknown as PhotoshootPackageShowcaseUpdateDto;

  it('finds all showcases', async () => {
    const dto = new PhotoshootPackageShowcaseFindAllDto();

    await expect(controller.findAll(user, 'package-id', dto)).resolves.toBe(
      'findAllShowcase',
    );
    expect(service.findAllShowcase).toHaveBeenCalledWith(
      'user-id',
      'package-id',
      dto,
    );
  });

  it('creates a showcase', async () => {
    await expect(
      controller.createShowcase(user, 'package-id', showcaseDto),
    ).resolves.toBe('createShowcase');
    expect(service.createShowcase).toHaveBeenCalledWith(
      'user-id',
      'package-id',
      showcaseDto,
    );
  });

  it('replaces a showcase', async () => {
    await expect(
      controller.replaceShowcaseById(user, 'package-id', 's1', showcaseDto),
    ).resolves.toBe('replaceShowcase');
    expect(service.replaceShowcase).toHaveBeenCalledWith(
      'user-id',
      'package-id',
      's1',
      showcaseDto,
    );
  });

  it('deletes a showcase', async () => {
    await expect(
      controller.deleteShowcaseById(user, 'package-id', 's1'),
    ).resolves.toBe(true);
    expect(service.deleteShowcase).toHaveBeenCalledWith(
      'user-id',
      'package-id',
      's1',
    );
  });
});

describe('PhotoShootPackageController', () => {
  const service = {
    findAll: jest.fn().mockResolvedValue('findAll'),
    getById: jest.fn().mockResolvedValue('getById'),
    findAllByUserId: jest.fn().mockResolvedValue('findAllByUserId'),
  };
  const controller = new PhotoShootPackageController(
    service as unknown as PhotoshootPackageService,
  );

  it('forces ENABLED status when finding all packages', async () => {
    const dto = Object.assign(new PhotoshootPackageFindAllDto(), {
      statuses: ['DISABLED'],
    });

    await expect(controller.findAll(dto)).resolves.toBe('findAll');
    expect(dto.statuses).toEqual(['ENABLED']);
    expect(service.findAll).toHaveBeenCalledWith(dto);
  });

  it('finds a package by id', async () => {
    await expect(controller.findPhotoshootPackageById('id')).resolves.toBe(
      'getById',
    );
    expect(service.getById).toHaveBeenCalledWith('id');
  });

  it('finds all packages of a photographer', async () => {
    await expect(
      controller.findAllWithPhotographerId('photographer-id', findAllDto),
    ).resolves.toBe('findAllByUserId');
    expect(service.findAllByUserId).toHaveBeenCalledWith(
      'photographer-id',
      findAllDto,
    );
  });
});
