import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookmarkService } from '../services/bookmark.service';
import { BookmarkController } from './bookmark.controller';

describe('BookmarkController', () => {
  let bookmarkService: jest.Mocked<Pick<BookmarkService, 'create' | 'delete'>>;
  let controller: BookmarkController;

  const user = { sub: 'u1' } as unknown as ParsedUserDto;

  beforeEach(() => {
    bookmarkService = {
      create: jest.fn(),
      delete: jest.fn(),
    };

    controller = new BookmarkController(
      bookmarkService as unknown as BookmarkService,
    );
  });

  it('should create bookmark for authenticated user', async () => {
    const dto = { id: 'b1' };
    bookmarkService.create.mockResolvedValue(dto as never);

    await expect(controller.createBookmark(user, 'p1')).resolves.toBe(dto);
    expect(bookmarkService.create).toHaveBeenCalledWith('u1', 'p1');
  });

  it('should delete bookmark for authenticated user', async () => {
    const dto = { id: 'b1' };
    bookmarkService.delete.mockResolvedValue(dto as never);

    await expect(controller.deleteBookmark(user, 'p1')).resolves.toBe(dto);
    expect(bookmarkService.delete).toHaveBeenCalledWith('u1', 'p1');
  });
});
