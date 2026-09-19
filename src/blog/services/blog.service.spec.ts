import { Blog } from '@prisma/client';
import { MemoryStoredFile } from 'nestjs-form-data';
import { BlogRepository } from 'src/database/repositories/blog.repository';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { BlogDto } from '../dtos/blog.dto';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogFindAllResponseDto } from '../dtos/rest/blog-find-all.response.dto';
import { BlogPutUpdateRequestDto } from '../dtos/rest/blog-put-update.request.dto';
import { BlogService } from './blog.service';

jest.mock('uuid', () => ({
  v4: () => 'blog-uuid',
}));

describe('BlogService', () => {
  let blogRepository: jest.Mocked<
    Pick<
      BlogRepository,
      | 'count'
      | 'findByIdOrThrow'
      | 'findAll'
      | 'create'
      | 'updateById'
      | 'deleteById'
    >
  >;
  let photoProcessService: jest.Mocked<
    Pick<PhotoProcessService, 'sharpInitFromBuffer' | 'makeThumbnail'>
  >;
  let bunnyService: jest.Mocked<
    Pick<BunnyService, 'getPresignedFile' | 'delete' | 'uploadFromBuffer'>
  >;
  let service: BlogService;

  const date = new Date('2026-01-01T00:00:00.000Z');

  const makeBlog = (overrides: Partial<Blog> = {}): Blog => ({
    id: 'blog1',
    userId: 'u1',
    status: 'ENABLED',
    title: 'Title',
    content: 'Content',
    thumbnail: 'blog_thumbnail/blog1.jpg',
    createdAt: date,
    updatedAt: date,
    ...overrides,
  });

  const makeFile = (buffer: Buffer, extension = 'png') =>
    ({ buffer, extension }) as unknown as MemoryStoredFile;

  beforeEach(() => {
    blogRepository = {
      count: jest.fn(),
      findByIdOrThrow: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };
    photoProcessService = {
      sharpInitFromBuffer: jest.fn(),
      makeThumbnail: jest.fn(),
    };
    bunnyService = {
      getPresignedFile: jest.fn((key: string) => `signed:${key}`),
      delete: jest.fn(),
      uploadFromBuffer: jest.fn(),
    };

    service = new BlogService(
      blogRepository as unknown as BlogRepository,
      photoProcessService as unknown as PhotoProcessService,
      bunnyService as unknown as BunnyService,
    );
  });

  describe('signBlogThumbnail', () => {
    it('should convert to dto and sign thumbnail', async () => {
      const result = await service.signBlogThumbnail(makeBlog());

      expect(result).toBeInstanceOf(BlogDto);
      expect(result.thumbnail).toBe('signed:blog_thumbnail/blog1.jpg');
      expect(bunnyService.getPresignedFile).toHaveBeenCalledWith(
        'blog_thumbnail/blog1.jpg',
      );
    });
  });

  describe('findById', () => {
    it('should return signed blog', async () => {
      blogRepository.findByIdOrThrow.mockResolvedValue(makeBlog());

      const result = await service.findById('blog1');

      expect(blogRepository.findByIdOrThrow).toHaveBeenCalledWith('blog1');
      expect(result.thumbnail).toBe('signed:blog_thumbnail/blog1.jpg');
    });

    it('should propagate not found error', async () => {
      blogRepository.findByIdOrThrow.mockRejectedValue(new Error('not found'));

      await expect(service.findById('x')).rejects.toThrow('not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated signed blogs', async () => {
      const dto = Object.assign(new BlogFindAllRequestDto(), {
        limit: 2,
        page: 1,
        search: 'abc',
        orderByCreatedAt: 'desc',
      });
      blogRepository.count.mockResolvedValue(3);
      blogRepository.findAll.mockResolvedValue([
        makeBlog(),
        makeBlog({ id: 'blog2', thumbnail: 'blog_thumbnail/blog2.jpg' }),
      ]);

      const result = await service.findAll(dto);

      expect(blogRepository.count).toHaveBeenCalledWith(dto.toWhere());
      expect(blogRepository.findAll).toHaveBeenCalledWith({
        skip: 2,
        take: 2,
        where: dto.toWhere(),
        orderBy: dto.toOrderBy(),
      });
      expect(result).toBeInstanceOf(BlogFindAllResponseDto);
      expect(result.totalPage).toBe(2);
      expect(result.totalRecord).toBe(3);
      expect(result.objects.map((b) => b.thumbnail)).toEqual([
        'signed:blog_thumbnail/blog1.jpg',
        'signed:blog_thumbnail/blog2.jpg',
      ]);
    });
  });

  describe('delete', () => {
    it('should delete thumbnail then blog', async () => {
      blogRepository.findByIdOrThrow.mockResolvedValue(makeBlog());
      bunnyService.delete.mockResolvedValue(undefined as never);
      blogRepository.deleteById.mockResolvedValue(makeBlog());

      await expect(service.delete('blog1')).resolves.toBe(true);
      expect(bunnyService.delete).toHaveBeenCalledWith(
        'blog_thumbnail/blog1.jpg',
      );
      expect(blogRepository.deleteById).toHaveBeenCalledWith('blog1');
    });

    it('should not delete anything when blog does not exist', async () => {
      blogRepository.findByIdOrThrow.mockRejectedValue(new Error('not found'));

      await expect(service.delete('x')).rejects.toThrow('not found');
      expect(bunnyService.delete).not.toHaveBeenCalled();
      expect(blogRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('replace', () => {
    it('should update fields and upload new thumbnail', async () => {
      const buffer = Buffer.from('img');
      const blog = makeBlog({ title: 'New' });
      blogRepository.findByIdOrThrow.mockResolvedValue(makeBlog());
      blogRepository.updateById.mockResolvedValue(blog);

      const dto = Object.assign(new BlogPutUpdateRequestDto(), {
        title: 'New',
        content: 'C',
        status: 'DISABLED',
        thumbnailFile: makeFile(buffer),
      });

      const result = await service.replace('blog1', dto);

      expect(blogRepository.updateById).toHaveBeenCalledWith('blog1', {
        title: 'New',
        content: 'C',
        status: 'DISABLED',
      });
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        blog.thumbnail,
        buffer,
      );
      expect(result.title).toBe('New');
    });

    it('should not update when blog does not exist', async () => {
      blogRepository.findByIdOrThrow.mockRejectedValue(new Error('not found'));

      await expect(
        service.replace(
          'x',
          Object.assign(new BlogPutUpdateRequestDto(), {
            thumbnailFile: makeFile(Buffer.from('a')),
          }),
        ),
      ).rejects.toThrow('not found');
      expect(blogRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should upload thumbnail when provided', async () => {
      const buffer = Buffer.from('img');
      blogRepository.findByIdOrThrow.mockResolvedValue(makeBlog());
      blogRepository.updateById.mockResolvedValue(makeBlog());

      await service.update('blog1', {
        title: 'T',
        thumbnailFile: makeFile(buffer),
      });

      expect(blogRepository.updateById).toHaveBeenCalledWith('blog1', {
        title: 'T',
        content: undefined,
        status: undefined,
      });
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'blog_thumbnail/blog1.jpg',
        buffer,
      );
    });

    it('should skip upload when thumbnail is not provided', async () => {
      blogRepository.findByIdOrThrow.mockResolvedValue(makeBlog());
      blogRepository.updateById.mockResolvedValue(
        makeBlog({ status: 'DISABLED' }),
      );

      const result = await service.update('blog1', { status: 'DISABLED' });

      expect(bunnyService.uploadFromBuffer).not.toHaveBeenCalled();
      expect(result.status).toBe('DISABLED');
    });
  });

  describe('create', () => {
    it('should make thumbnail, upload it and create blog', async () => {
      const original = Buffer.from('original');
      const thumbnail = Buffer.from('thumb');
      const sharp = { sharp: true };
      photoProcessService.sharpInitFromBuffer.mockResolvedValue(sharp as never);
      photoProcessService.makeThumbnail.mockResolvedValue(thumbnail);
      blogRepository.create.mockResolvedValue(
        makeBlog({
          id: 'blog-uuid',
          thumbnail: 'blog_thumbnail/blog-uuid.png',
        }),
      );

      const dto = Object.assign(new BlogCreateRequestDto(), {
        title: 'T',
        content: 'C',
        status: 'DISABLED',
        thumbnailFile: makeFile(original, 'png'),
      });

      const result = await service.create('u1', dto);

      expect(photoProcessService.sharpInitFromBuffer).toHaveBeenCalledWith(
        original,
      );
      expect(photoProcessService.makeThumbnail).toHaveBeenCalledWith(sharp);
      expect(bunnyService.uploadFromBuffer).toHaveBeenCalledWith(
        'blog_thumbnail/blog-uuid.png',
        thumbnail,
      );
      expect(blogRepository.create).toHaveBeenCalledWith({
        id: 'blog-uuid',
        content: 'C',
        title: 'T',
        status: 'ENABLED',
        thumbnail: 'blog_thumbnail/blog-uuid.png',
        user: { connect: { id: 'u1' } },
      });
      expect(result.thumbnail).toBe('signed:blog_thumbnail/blog-uuid.png');
    });

    it('should not create blog when upload fails', async () => {
      photoProcessService.sharpInitFromBuffer.mockResolvedValue({} as never);
      photoProcessService.makeThumbnail.mockResolvedValue(Buffer.from('t'));
      bunnyService.uploadFromBuffer.mockRejectedValue(new Error('upload'));

      await expect(
        service.create(
          'u1',
          Object.assign(new BlogCreateRequestDto(), {
            thumbnailFile: makeFile(Buffer.from('o')),
          }),
        ),
      ).rejects.toThrow('upload');
      expect(blogRepository.create).not.toHaveBeenCalled();
    });
  });
});
