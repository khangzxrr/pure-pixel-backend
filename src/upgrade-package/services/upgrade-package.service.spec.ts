import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';
import { UpgradePackageService } from './upgrade-package.service';
import { UpgradePackageFindAllDto } from '../dtos/rest/upgrade-package-find-all.request.dto';
import { UpgradePackageFindAllResposneDto } from '../dtos/rest/upgrade-package-find-all.response';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { UpgradePackageNotFoundException } from '../exceptions/upgrade-package-not-found.exception';
import { ExistUpgradePackageWithSameNameException } from '../exceptions/exist-upgrade-package-with-same-name.exception';
import { PutUpdateUpgradePackageDto } from '../dtos/rest/put-update-upgrade-package.request.dto';
import { PatchUpdateUpgradePackageDto } from '../dtos/rest/patch-update-upgrade-package.request.dto';
import { CreateUpgradePackageDto } from '../dtos/rest/create-upgrade-package.request.dto';

describe('UpgradePackageService', () => {
  let service: UpgradePackageService;

  const upgradePackageRepository = {
    findAll: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const makePackage = (overrides: Record<string, unknown> = {}) => ({
    id: 'pkg-1',
    name: 'Gold',
    summary: 'summary',
    price: new Prisma.Decimal(100000),
    minOrderMonth: 1,
    maxPhotoQuota: BigInt(1000),
    maxPackageCount: BigInt(10),
    descriptions: ['a'],
    status: 'ENABLED',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpgradePackageService,
        {
          provide: UpgradePackageRepository,
          useValue: upgradePackageRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(UpgradePackageService);
  });

  describe('findAll', () => {
    it('should return paginated upgrade package dtos', async () => {
      const findAllDto = Object.assign(new UpgradePackageFindAllDto(), {
        limit: 10,
        page: 0,
        search: 'Gold',
        id: 'pkg',
        status: 'ENABLED',
      });
      upgradePackageRepository.findAll.mockResolvedValue([makePackage()]);
      upgradePackageRepository.count.mockResolvedValue(15);

      const result = await service.findAll(findAllDto);

      expect(result).toBeInstanceOf(UpgradePackageFindAllResposneDto);
      expect(result.totalRecord).toBe(15);
      expect(result.totalPage).toBe(2);
      expect(result.objects[0]).toBeInstanceOf(UpgradePackageDto);
      expect(result.objects[0].price).toBe(100000);
      expect(upgradePackageRepository.findAll).toHaveBeenCalledWith(
        0,
        10,
        findAllDto.toWhere(),
        findAllDto.toOrderBy(),
      );
      expect(upgradePackageRepository.count).toHaveBeenCalledWith(
        findAllDto.toWhere(),
      );
    });
  });

  describe('replace', () => {
    const putDto = Object.assign(new PutUpdateUpgradePackageDto(), {
      name: 'Gold',
      summary: 'new summary',
      price: 200000,
      minOrderMonth: 2,
      maxPhotoQuota: 2000,
      maxPackageCount: 20,
      descriptions: ['b'],
      status: 'ENABLED',
    });

    it('should throw UpgradePackageNotFoundException when package does not exist', async () => {
      upgradePackageRepository.findById.mockResolvedValue(null);

      await expect(service.replace('pkg-1', putDto)).rejects.toThrow(
        UpgradePackageNotFoundException,
      );
      expect(upgradePackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ExistUpgradePackageWithSameNameException when another package has the same name', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ id: 'pkg-2' }),
      );

      await expect(service.replace('pkg-1', putDto)).rejects.toThrow(
        ExistUpgradePackageWithSameNameException,
      );
    });

    it('should replace package when name belongs to itself', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());
      upgradePackageRepository.update.mockResolvedValue(
        makePackage({ summary: 'new summary' }),
      );

      const result = await service.replace('pkg-1', putDto);

      expect(result).toBeInstanceOf(UpgradePackageDto);
      expect(result.summary).toBe('new summary');
      expect(upgradePackageRepository.update).toHaveBeenCalledWith('pkg-1', {
        name: 'Gold',
        summary: 'new summary',
        price: 200000,
        minOrderMonth: 2,
        maxPhotoQuota: 2000,
        maxPackageCount: 20,
        descriptions: ['b'],
        status: 'ENABLED',
      });
    });

    it('should replace package when no package has the same name', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.findFirst.mockResolvedValue(null);
      upgradePackageRepository.update.mockResolvedValue(makePackage());

      await expect(service.replace('pkg-1', putDto)).resolves.toBeInstanceOf(
        UpgradePackageDto,
      );
    });

    it('should skip name check when name is empty', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.update.mockResolvedValue(makePackage());

      await service.replace(
        'pkg-1',
        Object.assign(new PutUpdateUpgradePackageDto(), { name: '' }),
      );

      expect(upgradePackageRepository.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw UpgradePackageNotFoundException when package does not exist', async () => {
      upgradePackageRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('pkg-1', new PatchUpdateUpgradePackageDto()),
      ).rejects.toThrow(UpgradePackageNotFoundException);
    });

    it('should throw ExistUpgradePackageWithSameNameException when name is used by another package', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.findFirst.mockResolvedValue(
        makePackage({ id: 'pkg-2' }),
      );

      await expect(
        service.update(
          'pkg-1',
          Object.assign(new PatchUpdateUpgradePackageDto(), { name: 'Gold' }),
        ),
      ).rejects.toThrow(ExistUpgradePackageWithSameNameException);
    });

    it('should update package when name is unique', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.findFirst.mockResolvedValue(null);
      upgradePackageRepository.update.mockResolvedValue(
        makePackage({ name: 'Silver' }),
      );

      const result = await service.update(
        'pkg-1',
        Object.assign(new PatchUpdateUpgradePackageDto(), { name: 'Silver' }),
      );

      expect(result.name).toBe('Silver');
      expect(upgradePackageRepository.update).toHaveBeenCalledWith(
        'pkg-1',
        expect.objectContaining({ name: 'Silver' }),
      );
    });

    it('should update package without name check when name is not provided', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.update.mockResolvedValue(makePackage());

      await service.update(
        'pkg-1',
        Object.assign(new PatchUpdateUpgradePackageDto(), { summary: 'x' }),
      );

      expect(upgradePackageRepository.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw UpgradePackageNotFoundException when package does not exist', async () => {
      upgradePackageRepository.findById.mockResolvedValue(null);

      await expect(service.delete('pkg-1')).rejects.toThrow(
        UpgradePackageNotFoundException,
      );
      expect(upgradePackageRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete package and return dto', async () => {
      upgradePackageRepository.findById.mockResolvedValue(makePackage());
      upgradePackageRepository.delete.mockResolvedValue(makePackage());

      const result = await service.delete('pkg-1');

      expect(result).toBeInstanceOf(UpgradePackageDto);
      expect(upgradePackageRepository.delete).toHaveBeenCalledWith('pkg-1');
    });
  });

  describe('create', () => {
    const createDto = Object.assign(new CreateUpgradePackageDto(), {
      name: 'Gold',
      price: 100000,
    });

    it('should throw ExistUpgradePackageWithSameNameException when name exists', async () => {
      upgradePackageRepository.findFirst.mockResolvedValue(makePackage());

      await expect(service.create(createDto)).rejects.toThrow(
        ExistUpgradePackageWithSameNameException,
      );
      expect(upgradePackageRepository.create).not.toHaveBeenCalled();
    });

    it('should create new package', async () => {
      upgradePackageRepository.findFirst.mockResolvedValue(null);
      upgradePackageRepository.create.mockResolvedValue(makePackage());

      const result = await service.create(createDto);

      expect(result).toBeInstanceOf(UpgradePackageDto);
      expect(upgradePackageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Gold', price: 100000 }),
      );
    });
  });
});
