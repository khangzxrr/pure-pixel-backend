import { PrismaService } from 'src/prisma.service';
import { PhotoSellPriceTagRepository } from './photo-sell-price-tag.repository';

describe('PhotoSellPriceTagRepository', () => {
  const photoSell = { findUniqueOrThrow: jest.fn() };
  const pricetag = { findFirstOrThrow: jest.fn() };
  const repository = new PhotoSellPriceTagRepository({
    extendedClient: () => ({ photoSell, pricetag }),
  } as unknown as PrismaService);

  it('findByIdOrThrow should find photo sell by id', () => {
    photoSell.findUniqueOrThrow.mockReturnValue('photo-sell');

    expect(repository.findByIdOrThrow('s')).toBe('photo-sell');
    expect(photoSell.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 's' },
    });
  });

  it('findUniqueOrThrow should find first price tag', () => {
    pricetag.findFirstOrThrow.mockReturnValue('pricetag');

    expect(repository.findUniqueOrThrow({ id: 'p' })).toBe('pricetag');
    expect(pricetag.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'p' },
    });
  });
});
