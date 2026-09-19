//load SignedPhotoBuyDto first to break the dto import cycle
import '../dtos/rest/signed-photo-buy.response.dto';
import { Response } from 'express';
import { PassThrough } from 'stream';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { PhotoExchangeService } from '../services/photo-exchange.service';
import { PhotoSellBuyController } from './photo-sellbuy.controller';

describe('PhotoSellBuyController', () => {
  const user = { sub: 'u1' } as ParsedUserDto;
  let photoExchangeService: Record<
    | 'sellPhoto'
    | 'replaceSellPhoto'
    | 'stopSellingPhoto'
    | 'buyPhotoRequest'
    | 'downloadBoughtPhoto'
    | 'getPhotoBuyByPhotoId',
    jest.Mock
  >;
  let controller: PhotoSellBuyController;

  beforeEach(() => {
    photoExchangeService = {
      sellPhoto: jest.fn().mockResolvedValue('sold'),
      replaceSellPhoto: jest.fn().mockResolvedValue('replaced'),
      stopSellingPhoto: jest.fn().mockResolvedValue(true),
      buyPhotoRequest: jest.fn().mockResolvedValue('bought'),
      downloadBoughtPhoto: jest.fn().mockResolvedValue(Buffer.from('image')),
      getPhotoBuyByPhotoId: jest.fn().mockResolvedValue('photo-buys'),
    };
    controller = new PhotoSellBuyController(
      photoExchangeService as unknown as PhotoExchangeService,
    );
  });

  const sellDto = { pricetags: [] } as unknown as CreatePhotoSellingDto;

  it('sells a photo', async () => {
    await expect(controller.sellPhoto(user, 'p1', sellDto)).resolves.toBe(
      'sold',
    );
    expect(photoExchangeService.sellPhoto).toHaveBeenCalledWith(
      'u1',
      'p1',
      sellDto,
    );
  });

  it('replaces a photo selling', async () => {
    await expect(controller.updateSellPhoto(user, 'p1', sellDto)).resolves.toBe(
      'replaced',
    );
    expect(photoExchangeService.replaceSellPhoto).toHaveBeenCalledWith(
      'u1',
      'p1',
      sellDto,
    );
  });

  it('stops selling a photo', async () => {
    await expect(controller.stopSellingPhoto(user, 'p1')).resolves.toBe(true);
    expect(photoExchangeService.stopSellingPhoto).toHaveBeenCalledWith(
      'u1',
      'p1',
    );
  });

  it('buys a photo', async () => {
    const dto = { paymentMethod: 'WALLET' } as BuyPhotoRequestDto;

    await expect(
      controller.buyPhoto(user, 'p1', 'ps1', 'pt1', dto),
    ).resolves.toBe('bought');
    expect(photoExchangeService.buyPhotoRequest).toHaveBeenCalledWith(
      'u1',
      'p1',
      'ps1',
      'pt1',
      dto,
    );
  });

  it('streams the bought photo to the response', async () => {
    const res = Object.assign(new PassThrough(), { set: jest.fn() });
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise((resolve) => res.on('end', resolve));

    await controller.getPhotoBought(
      user,
      'p1',
      'pb1',
      res as unknown as Response,
    );
    await finished;

    expect(photoExchangeService.downloadBoughtPhoto).toHaveBeenCalledWith(
      'p1',
      'u1',
      'pb1',
    );
    expect(res.set).toHaveBeenCalledWith({ 'Content-type': 'image/jpeg' });
    expect(Buffer.concat(chunks).toString()).toBe('image');
  });

  it('gets photo buys of a photo', async () => {
    await expect(controller.getBoughtPhoto(user, 'p1')).resolves.toBe(
      'photo-buys',
    );
    expect(photoExchangeService.getPhotoBuyByPhotoId).toHaveBeenCalledWith(
      'u1',
      'p1',
    );
  });
});
