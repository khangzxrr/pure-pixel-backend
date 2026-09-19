//load SignedPhotoBuyDto first to break the dto import cycle
import '../dtos/rest/signed-photo-buy.response.dto';
import { Prisma } from '@prisma/client';
import { PhotoBuyRepository } from 'src/database/repositories/photo-buy.repository';
import { PhotoSellPriceTagRepository } from 'src/database/repositories/photo-sell-price-tag.repository';
import { PhotoSellRepository } from 'src/database/repositories/photo-sell.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { SepayService } from 'src/payment/services/sepay.service';
import { PrismaService } from 'src/prisma.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoSellDto } from '../dtos/photo-sell.dto';
import { PhotoWithSignedPhotoBuys } from '../dtos/photo-with-signed-photo-buy.dto';
import { PhotoBuyFindAllDto } from '../dtos/rest/photo-buy-find-all.dto';
import { PhotoBuyFindAllResponseDto } from '../dtos/rest/photo-buy-find-all.response.dto';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { CannotBuyOwnedPhotoException } from '../exceptions/cannot-buy-owned-photo.exception';
import { CannotPerformOnBookingPhoto } from '../exceptions/cannot-perform-on-booking-photo.exception';
import { ExistSuccessedPhotoBuyException } from '../exceptions/exist-photo-buy-with-choosed-resolution.exception';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { PhotoBannedException } from '../exceptions/photo-banned.exception';
import { PhotoBuyTransactionIsNotSuccessException } from '../exceptions/photo-buy-transaction-is-not-success.exception';
import { SellQualityNotExistException } from '../exceptions/sell-quality-is-not-exist.exception';
import { PhotoExchangeService } from './photo-exchange.service';
import { PhotoProcessService } from './photo-process.service';
import { PhotoService } from './photo.service';

describe('PhotoExchangeService', () => {
  let photoRepository: Record<
    | 'countIgnoreSoftDelete'
    | 'findAllIgnoreSoftDelete'
    | 'findUniqueOrThrowIgnoreSoftDelete'
    | 'findUniqueOrThrow'
    | 'updateById'
    | 'updateQueryById',
    jest.Mock
  >;
  let photoSellRepository: Record<
    | 'updateMany'
    | 'findFirst'
    | 'deactivatePhotoSellByPhotoIdQuery'
    | 'createAndActiveByPhotoIdQuery'
    | 'findUniqueOrThrow',
    jest.Mock
  >;
  let photoBuyRepository: Record<
    'findUniqueOrThrow' | 'findAll' | 'findFirst' | 'createWithTransaction',
    jest.Mock
  >;
  let userRepository: Record<'findUniqueOrThrow', jest.Mock>;
  let userToUserTransactionRepository: Record<
    'findMany' | 'updateById',
    jest.Mock
  >;
  let photoSellPriceTagRepository: Record<'findUniqueOrThrow', jest.Mock>;
  let photoService: Record<
    | 'signWatermarkPhotos'
    | 'findAndValidatePhotoIsNotFoundAndBelongToPhotographer'
    | 'getAvailablePhotoResolution'
    | 'sendImageWatermarkQueue',
    jest.Mock
  >;
  let photoProcessService: Record<
    | 'sharpInitFromFilePath'
    | 'getBufferFromKey'
    | 'sharpInitFromBuffer'
    | 'resizeWithMetadata',
    jest.Mock
  >;
  let prismaTransaction: jest.Mock;
  let extendedTransaction: jest.Mock;
  let sepayService: Record<
    | 'validateWalletBalanceIsEnough'
    | 'generatePaymentUrl'
    | 'generateMockIpnQrCode',
    jest.Mock
  >;
  let notificationService: Record<'addNotificationToQueue', jest.Mock>;
  let bunnyService: Record<'getPresignedFile', jest.Mock>;
  let service: PhotoExchangeService;

  const tx = { id: 'tx' };
  const originalBackendOrigin = process.env.BACKEND_ORIGIN;

  const buildPhoto = (overrides: Record<string, unknown> = {}) => ({
    id: 'p1',
    title: 'Sunset',
    description: 'desc',
    photographerId: 'owner',
    status: 'PARSED',
    photoType: 'RAW',
    width: 1000,
    height: 800,
    originalPhotoUrl: 'owner/p1.jpg',
    watermarkPhotoUrl: 'watermark/owner/p1.jpg',
    ...overrides,
  });

  beforeEach(() => {
    process.env.BACKEND_ORIGIN = 'https://api.test';

    photoRepository = {
      countIgnoreSoftDelete: jest.fn().mockResolvedValue(3),
      findAllIgnoreSoftDelete: jest
        .fn()
        .mockResolvedValue([buildPhoto(), buildPhoto({ id: 'p2' })]),
      findUniqueOrThrowIgnoreSoftDelete: jest
        .fn()
        .mockResolvedValue(buildPhoto()),
      findUniqueOrThrow: jest.fn().mockResolvedValue(buildPhoto()),
      updateById: jest.fn().mockResolvedValue(buildPhoto()),
      updateQueryById: jest.fn().mockReturnValue('update-photo-query'),
    };
    photoSellRepository = {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue(null),
      deactivatePhotoSellByPhotoIdQuery: jest
        .fn()
        .mockReturnValue('deactivate-query'),
      createAndActiveByPhotoIdQuery: jest.fn().mockReturnValue('create-query'),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'ps1',
        photo: { photographerId: 'owner', title: 'Sunset' },
      }),
    };
    photoBuyRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        userToUserTransaction: { fromUserTransaction: { status: 'SUCCESS' } },
        photoSellHistory: { width: 1000, height: 800 },
      }),
      findAll: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      createWithTransaction: jest.fn(),
    };
    userRepository = {
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ id: 'buyer', name: 'B' }),
    };
    userToUserTransactionRepository = {
      findMany: jest.fn().mockResolvedValue([]),
      updateById: jest.fn().mockResolvedValue({}),
    };
    photoSellPriceTagRepository = {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'pt1',
        width: 800,
        height: 640,
        price: new Prisma.Decimal(200000),
      }),
    };
    photoService = {
      signWatermarkPhotos: jest.fn(async (p: { id: string }) => ({
        id: p.id,
        signed: true,
      })),
      findAndValidatePhotoIsNotFoundAndBelongToPhotographer: jest
        .fn()
        .mockResolvedValue(buildPhoto()),
      getAvailablePhotoResolution: jest.fn().mockResolvedValue([
        { width: 1000, height: 800 },
        { width: 800, height: 640 },
      ]),
      sendImageWatermarkQueue: jest.fn().mockResolvedValue({}),
    };
    photoProcessService = {
      sharpInitFromFilePath: jest.fn(),
      getBufferFromKey: jest.fn().mockResolvedValue(Buffer.from('cloud')),
      sharpInitFromBuffer: jest.fn().mockResolvedValue('sharp'),
      resizeWithMetadata: jest.fn().mockResolvedValue(Buffer.from('resized')),
    };
    prismaTransaction = jest.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    extendedTransaction = jest.fn(async (queries: unknown[]) => [
      ...queries.slice(0, -1),
      { active: true, pricetags: [{ width: 800, height: 640, price: 1 }] },
    ]);
    sepayService = {
      validateWalletBalanceIsEnough: jest.fn().mockResolvedValue(undefined),
      generatePaymentUrl: jest.fn().mockReturnValue('https://pay'),
      generateMockIpnQrCode: jest.fn().mockResolvedValue('qr'),
    };
    notificationService = {
      addNotificationToQueue: jest.fn().mockResolvedValue({}),
    };
    bunnyService = {
      getPresignedFile: jest.fn(
        (key: string, query: string) => `signed:${key}${query}`,
      ),
    };

    service = new PhotoExchangeService(
      photoRepository as unknown as PhotoRepository,
      photoSellRepository as unknown as PhotoSellRepository,
      photoBuyRepository as unknown as PhotoBuyRepository,
      userRepository as unknown as UserRepository,
      userToUserTransactionRepository as unknown as UserToUserRepository,
      photoSellPriceTagRepository as unknown as PhotoSellPriceTagRepository,
      photoService as unknown as PhotoService,
      photoProcessService as unknown as PhotoProcessService,
      {
        $transaction: prismaTransaction,
        extendedClient: jest
          .fn()
          .mockReturnValue({ $transaction: extendedTransaction }),
      } as unknown as PrismaService,
      sepayService as unknown as SepayService,
      notificationService as unknown as NotificationService,
      bunnyService as unknown as BunnyService,
    );
  });

  afterAll(() => {
    process.env.BACKEND_ORIGIN = originalBackendOrigin;
  });

  describe('getAllPreviousBuyPhoto', () => {
    it('returns signed watermark photos bought by the user', async () => {
      const findAllDto = Object.assign(new PhotoBuyFindAllDto(), {
        limit: 2,
        page: 1,
        search: 'sun',
        orderByCreatedAt: 'desc',
      });

      const result = await service.getAllPreviousBuyPhoto('buyer', findAllDto);

      const where = photoRepository.countIgnoreSoftDelete.mock.calls[0][0];
      expect(
        where.AND[0].photoSellings.some.photoSellHistories.some.photoBuy.some
          .buyerId,
      ).toBe('buyer');
      expect(where.AND[1].OR).toEqual(findAllDto.toWhere().OR);
      expect(photoRepository.findAllIgnoreSoftDelete).toHaveBeenCalledWith(
        where,
        [{ createdAt: 'desc' }],
        2,
        2,
      );
      expect(photoService.signWatermarkPhotos).toHaveBeenCalledTimes(2);
      expect(result).toBeInstanceOf(PhotoBuyFindAllResponseDto);
      expect(result).toMatchObject({
        totalRecord: 3,
        totalPage: 2,
        objects: [
          { id: 'p1', signed: true },
          { id: 'p2', signed: true },
        ],
      });
    });
  });

  describe('downloadBoughtPhoto', () => {
    it('throws when the buy transaction is not successful', async () => {
      photoBuyRepository.findUniqueOrThrow.mockResolvedValue({
        userToUserTransaction: { fromUserTransaction: { status: 'PENDING' } },
        photoSellHistory: { width: 1000, height: 800 },
      });

      await expect(
        service.downloadBoughtPhoto('p1', 'buyer', 'pb1'),
      ).rejects.toBeInstanceOf(PhotoBuyTransactionIsNotSuccessException);
      expect(photoBuyRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'pb1',
        buyerId: 'buyer',
      });
    });

    it('returns original file buffer of a pending photo at full size', async () => {
      photoRepository.findUniqueOrThrowIgnoreSoftDelete.mockResolvedValue(
        buildPhoto({ status: 'PENDING', originalPhotoUrl: '/tmp/a.jpg' }),
      );
      photoProcessService.sharpInitFromFilePath.mockResolvedValue({
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('local')),
      });

      await expect(
        service.downloadBoughtPhoto('p1', 'buyer', 'pb1'),
      ).resolves.toEqual(Buffer.from('local'));
      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        '/tmp/a.jpg',
      );
      expect(photoProcessService.resizeWithMetadata).not.toHaveBeenCalled();
    });

    it('returns cloud buffer of a parsed photo at full size', async () => {
      await expect(
        service.downloadBoughtPhoto('p1', 'buyer', 'pb1'),
      ).resolves.toEqual(Buffer.from('cloud'));
      expect(photoProcessService.getBufferFromKey).toHaveBeenCalledWith(
        'owner/p1.jpg',
      );
    });

    it.each([
      [800, 640],
      [1000, 640],
    ])(
      'resizes when bought size %ix%i differs from the photo',
      async (width, height) => {
        photoBuyRepository.findUniqueOrThrow.mockResolvedValue({
          userToUserTransaction: {
            fromUserTransaction: { status: 'SUCCESS' },
          },
          photoSellHistory: { width, height },
        });

        await expect(
          service.downloadBoughtPhoto('p1', 'buyer', 'pb1'),
        ).resolves.toEqual(Buffer.from('resized'));
        expect(photoProcessService.sharpInitFromBuffer).toHaveBeenCalledWith(
          Buffer.from('cloud'),
        );
        expect(photoProcessService.resizeWithMetadata).toHaveBeenCalledWith(
          'sharp',
          width,
        );
      },
    );
  });

  describe('stopSellingPhoto', () => {
    it('throws for duplicated photos', async () => {
      photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer.mockResolvedValue(
        buildPhoto({ status: 'DUPLICATED' }),
      );

      await expect(
        service.stopSellingPhoto('owner', 'p1'),
      ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
    });

    it('throws for booking photos', async () => {
      photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer.mockResolvedValue(
        buildPhoto({ photoType: 'BOOKING' }),
      );

      await expect(
        service.stopSellingPhoto('owner', 'p1'),
      ).rejects.toBeInstanceOf(CannotPerformOnBookingPhoto);
    });

    it('deactivates sellings and makes photo private without watermark', async () => {
      await expect(service.stopSellingPhoto('owner', 'p1')).resolves.toBe(true);

      expect(
        photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer,
      ).toHaveBeenCalledWith('owner', 'p1');
      expect(photoSellRepository.updateMany).toHaveBeenCalledWith(
        { photoId: 'p1' },
        { active: false },
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('p1', {
        visibility: 'PRIVATE',
        watermark: false,
      });
    });
  });

  describe('sellPhoto', () => {
    const sellDto = {
      pricetags: [{ width: 800, height: 640, price: 100000 }],
    } as unknown as CreatePhotoSellingDto;

    it.each([
      [{ status: 'DUPLICATED' }, FailToPerformOnDuplicatedPhotoException],
      [{ photoType: 'BOOKING' }, CannotPerformOnBookingPhoto],
      [{ status: 'BAN' }, PhotoBannedException],
    ])('throws for photo %p', async (overrides, exception) => {
      photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer.mockResolvedValue(
        buildPhoto(overrides),
      );

      await expect(
        service.sellPhoto('owner', 'p1', sellDto),
      ).rejects.toBeInstanceOf(exception);
    });

    it('throws when a pricetag size is not available', async () => {
      const invalidDto = {
        pricetags: [{ width: 800, height: 600, price: 100000 }],
      } as unknown as CreatePhotoSellingDto;

      await expect(
        service.sellPhoto('owner', 'p1', invalidDto),
      ).rejects.toBeInstanceOf(SellQualityNotExistException);
      expect(extendedTransaction).not.toHaveBeenCalled();
    });

    it('creates an active photo sell for a photo without previous selling', async () => {
      const result = await service.sellPhoto('owner', 'p1', sellDto);

      expect(photoSellRepository.findFirst).toHaveBeenCalledWith({
        active: true,
        photoId: 'p1',
      });
      expect(photoService.sendImageWatermarkQueue).not.toHaveBeenCalled();
      expect(
        photoSellRepository.deactivatePhotoSellByPhotoIdQuery,
      ).not.toHaveBeenCalled();
      expect(photoRepository.updateQueryById).toHaveBeenCalledWith('p1', {
        watermark: true,
        visibility: 'PUBLIC',
      });
      expect(
        photoSellRepository.createAndActiveByPhotoIdQuery,
      ).toHaveBeenCalledWith({
        active: true,
        photo: { connect: { id: 'p1' } },
        pricetags: {
          create: [{ width: 800, height: 640, price: 100000 }],
        },
      });
      expect(extendedTransaction).toHaveBeenCalledWith([
        'update-photo-query',
        'create-query',
      ]);
      expect(result).toBeInstanceOf(PhotoSellDto);
      expect(result.active).toBe(true);
    });

    it('generates watermark and deactivates previous selling when replacing', async () => {
      photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer.mockResolvedValue(
        buildPhoto({ watermarkPhotoUrl: '' }),
      );
      photoSellRepository.findFirst.mockResolvedValue({ id: 'old' });

      await service.replaceSellPhoto('owner', 'p1', sellDto);

      expect(photoService.sendImageWatermarkQueue).toHaveBeenCalledWith(
        'owner',
        'p1',
        { text: 'PXL' },
      );
      expect(
        photoSellRepository.deactivatePhotoSellByPhotoIdQuery,
      ).toHaveBeenCalledWith('p1');
      expect(extendedTransaction).toHaveBeenCalledWith([
        'deactivate-query',
        'update-photo-query',
        'create-query',
      ]);
    });
  });

  describe('getPhotoBuyByPhotoId', () => {
    it('signs successful photo buys', async () => {
      photoBuyRepository.findAll.mockResolvedValue([
        {
          id: 'pb1',
          photoSellHistory: { width: 800 },
          userToUserTransaction: { fromUserTransaction: { status: 'SUCCESS' } },
        },
        {
          id: 'pb2',
          photoSellHistory: { width: 600 },
          userToUserTransaction: { fromUserTransaction: { status: 'PENDING' } },
        },
      ]);

      const result = await service.getPhotoBuyByPhotoId('buyer', 'p1');

      expect(photoBuyRepository.findAll).toHaveBeenCalledWith({
        photoSellHistory: { originalPhotoSell: { photoId: 'p1' } },
        userToUserTransaction: {
          fromUserTransaction: { status: 'SUCCESS', userId: 'buyer' },
        },
      });
      expect(result).toBeInstanceOf(PhotoWithSignedPhotoBuys);
      expect(result.photoBuys[0]).toBeInstanceOf(SignedPhotoBuyDto);
      expect(result.photoBuys[0].previewUrl).toBe(
        'signed:owner/p1.jpg?width=800',
      );
      expect(result.photoBuys[0].downloadUrl).toBe(
        'https://api.test/photo/p1/photo-buy/pb1/download',
      );
      expect(result.photoBuys[1].previewUrl).toBeUndefined();
      expect(result.photoBuys[1].downloadUrl).toBeUndefined();
    });
  });

  describe('buyPhotoRequest', () => {
    it('throws when photo is banned', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(
        buildPhoto({ status: 'BAN' }),
      );

      await expect(
        service.buyPhotoRequest('buyer', 'p1', 'ps1', 'pt1', {
          paymentMethod: 'WALLET',
        }),
      ).rejects.toBeInstanceOf(PhotoBannedException);
    });

    it('throws when buying own photo', async () => {
      await expect(
        service.buyPhotoRequest('owner', 'p1', 'ps1', 'pt1', {
          paymentMethod: 'WALLET',
        }),
      ).rejects.toBeInstanceOf(CannotBuyOwnedPhotoException);
      expect(photoSellRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'ps1',
        photoId: 'p1',
        active: true,
      });
    });

    it('throws when the same size was already bought', async () => {
      photoBuyRepository.findFirst.mockResolvedValue({ id: 'pb-old' });

      await expect(
        service.buyPhotoRequest('buyer', 'p1', 'ps1', 'pt1', {
          paymentMethod: 'WALLET',
        }),
      ).rejects.toBeInstanceOf(ExistSuccessedPhotoBuyException);
      expect(
        photoSellPriceTagRepository.findUniqueOrThrow,
      ).toHaveBeenCalledWith({ photoSellId: 'ps1', id: 'pt1' });
    });

    it('buys with wallet, cancels pending transactions and notifies both users', async () => {
      userToUserTransactionRepository.findMany.mockResolvedValue([
        { id: 't1' },
        { id: 't2' },
      ]);
      photoBuyRepository.createWithTransaction.mockResolvedValue({
        id: 'pb1',
        photoSellHistoryId: 'psh1',
      });

      const result = await service.buyPhotoRequest(
        'buyer',
        'p1',
        'ps1',
        'pt1',
        {
          paymentMethod: 'WALLET',
        },
      );

      expect(userToUserTransactionRepository.updateById).toHaveBeenCalledTimes(
        2,
      );
      expect(userToUserTransactionRepository.updateById).toHaveBeenCalledWith(
        't1',
        {
          fromUserTransaction: { update: { data: { status: 'CANCEL' } } },
        },
        tx,
      );
      expect(sepayService.validateWalletBalanceIsEnough).toHaveBeenCalledWith(
        'buyer',
        200000,
      );
      const [data, client] =
        photoBuyRepository.createWithTransaction.mock.calls[0];
      expect(client).toBe(tx);
      const toUserTransaction =
        data.userToUserTransaction.create.toUserTransaction.create;
      const fromUserTransaction =
        data.userToUserTransaction.create.fromUserTransaction.create;
      expect(toUserTransaction).toMatchObject({
        type: 'IMAGE_SELL',
        status: 'SUCCESS',
        paymentMethod: 'WALLET',
        user: { connect: { id: 'owner' } },
      });
      expect(toUserTransaction.fee.toNumber()).toBe(20000);
      expect(fromUserTransaction).toMatchObject({
        type: 'IMAGE_BUY',
        status: 'SUCCESS',
        paymentMethod: 'WALLET',
        user: { connect: { id: 'buyer' } },
      });
      expect(data.photoSellHistory.create).toMatchObject({
        width: 800,
        height: 640,
        title: 'Sunset',
        description: 'desc',
        originalPhotoSell: { connect: { id: 'ps1' } },
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'buyer',
          referenceType: 'CUSTOMER_PHOTO_BUY',
        }),
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'owner',
          referenceType: 'PHOTOGRAPHER_PHOTO_SELL',
        }),
      );
      expect(result).toBeInstanceOf(PhotoBuyResponseDto);
      expect(sepayService.generatePaymentUrl).not.toHaveBeenCalled();
    });

    it('buys with sepay and returns payment url and mock qr code', async () => {
      photoBuyRepository.createWithTransaction.mockResolvedValue({
        id: 'pb1',
        userToUserTransaction: {
          fromUserTransaction: {
            id: 'from-tx',
            amount: new Prisma.Decimal(200000),
          },
        },
      });

      const result = await service.buyPhotoRequest(
        'buyer',
        'p1',
        'ps1',
        'pt1',
        {
          paymentMethod: 'SEPAY',
        },
      );

      expect(sepayService.validateWalletBalanceIsEnough).not.toHaveBeenCalled();
      const [data] = photoBuyRepository.createWithTransaction.mock.calls[0];
      expect(
        data.userToUserTransaction.create.toUserTransaction,
      ).toBeUndefined();
      expect(
        data.userToUserTransaction.create.fromUserTransaction.create,
      ).toMatchObject({ status: 'PENDING', paymentMethod: 'SEPAY' });
      expect(sepayService.generatePaymentUrl).toHaveBeenCalledWith(
        'from-tx',
        200000,
      );
      expect(sepayService.generateMockIpnQrCode).toHaveBeenCalledWith(
        'from-tx',
        200000,
      );
      expect(notificationService.addNotificationToQueue).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(PhotoBuyResponseDto);
      expect(result.paymentUrl).toBe('https://pay');
      expect(result.mockQrCode).toBe('qr');
    });
  });
});
