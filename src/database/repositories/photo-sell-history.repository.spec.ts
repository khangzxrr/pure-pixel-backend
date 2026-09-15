import { PrismaService } from 'src/prisma.service';
import { PhotoSellHistoryRepository } from './photo-sell-history.repository';

describe('PhotoSellHistoryRepository', () => {
  it('count should count with where through the extended client', () => {
    const photoSellHistory = { count: jest.fn().mockReturnValue(7) };
    const repository = new PhotoSellHistoryRepository({
      extendedClient: () => ({ photoSellHistory }),
    } as unknown as PrismaService);

    expect(repository.count({ originalPhotoSellId: 's' })).toBe(7);
    expect(photoSellHistory.count).toHaveBeenCalledWith({
      where: { originalPhotoSellId: 's' },
    });
  });
});
