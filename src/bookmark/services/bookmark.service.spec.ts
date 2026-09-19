import { BookmarkRepository } from 'src/database/repositories/bookmark.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { BookmarkDto } from '../dtos/bookmark.dto';
import { PhotoIsPrivateException } from '../exceptions/photo-is-privated.exception';
import { BookmarkService } from './bookmark.service';

describe('BookmarkService', () => {
  let bookmarkRepository: jest.Mocked<
    Pick<BookmarkRepository, 'upsert' | 'delete'>
  >;
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'findUniqueOrThrow'>>;
  let service: BookmarkService;

  const bookmark = { id: 'b1', userId: 'u1', photoId: 'p1' };

  beforeEach(() => {
    bookmarkRepository = {
      upsert: jest.fn(),
      delete: jest.fn(),
    };
    photoRepository = {
      findUniqueOrThrow: jest.fn(),
    };

    service = new BookmarkService(
      bookmarkRepository as unknown as BookmarkRepository,
      photoRepository as unknown as PhotoRepository,
    );
  });

  describe('create', () => {
    it('should throw PhotoIsPrivateException when photo is private', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
        visibility: 'PRIVATE',
      } as never);

      await expect(service.create('u1', 'p1')).rejects.toBeInstanceOf(
        PhotoIsPrivateException,
      );
      expect(bookmarkRepository.upsert).not.toHaveBeenCalled();
    });

    it('should upsert bookmark for public photo', async () => {
      photoRepository.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
        visibility: 'PUBLIC',
      } as never);
      bookmarkRepository.upsert.mockResolvedValue(bookmark as never);

      const result = await service.create('u1', 'p1');

      expect(photoRepository.findUniqueOrThrow).toHaveBeenCalledWith('p1');
      expect(bookmarkRepository.upsert).toHaveBeenCalledWith(
        { userId_photoId: { userId: 'u1', photoId: 'p1' } },
        {
          user: { connect: { id: 'u1' } },
          photo: { connect: { id: 'p1' } },
        },
      );
      expect(result).toBeInstanceOf(BookmarkDto);
      expect(result).toMatchObject({ userId: 'u1', photoId: 'p1' });
    });

    it('should propagate photo lookup errors', async () => {
      photoRepository.findUniqueOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.create('u1', 'p1')).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('should delete bookmark by composite key', async () => {
      bookmarkRepository.delete.mockResolvedValue(bookmark as never);

      const result = await service.delete('u1', 'p1');

      expect(bookmarkRepository.delete).toHaveBeenCalledWith({
        userId_photoId: { userId: 'u1', photoId: 'p1' },
      });
      expect(result).toBeInstanceOf(BookmarkDto);
    });
  });
});
