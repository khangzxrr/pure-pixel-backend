//load SignedPhotoBuyDto first to break the dto import cycle
import '../dtos/rest/signed-photo-buy.response.dto';
import { PhotoExchangeController } from './photo-exchange.controller';
import { PhotoExchangeService } from '../services/photo-exchange.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoBuyFindAllDto } from '../dtos/rest/photo-buy-find-all.dto';

describe('PhotoExchangeController', () => {
  it('returns previous bought photos of the authenticated user', async () => {
    const response = { objects: [] };
    const photoExchangeService = {
      getAllPreviousBuyPhoto: jest.fn().mockResolvedValue(response),
    };
    const controller = new PhotoExchangeController(
      photoExchangeService as unknown as PhotoExchangeService,
    );
    const user = { sub: 'user-1' } as ParsedUserDto;
    const findAllDto = new PhotoBuyFindAllDto();

    await expect(controller.findAllPhotobuys(user, findAllDto)).resolves.toBe(
      response,
    );
    expect(photoExchangeService.getAllPreviousBuyPhoto).toHaveBeenCalledWith(
      'user-1',
      findAllDto,
    );
  });
});
