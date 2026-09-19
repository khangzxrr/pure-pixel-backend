import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogPutUpdateRequestDto } from '../dtos/rest/blog-put-update.request.dto';
import { BlogService } from '../services/blog.service';
import { BlogController } from './blog.controller';

describe('BlogController', () => {
  let blogService: jest.Mocked<
    Pick<
      BlogService,
      'findAll' | 'findById' | 'delete' | 'create' | 'update' | 'replace'
    >
  >;
  let controller: BlogController;

  beforeEach(() => {
    blogService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replace: jest.fn(),
    };

    controller = new BlogController(blogService as unknown as BlogService);
  });

  it('should find all blogs', async () => {
    const dto = Object.assign(new BlogFindAllRequestDto(), {
      limit: 1,
      page: 0,
    });
    const response = { objects: [] };
    blogService.findAll.mockResolvedValue(response as never);

    await expect(controller.findAll(dto)).resolves.toBe(response);
    expect(blogService.findAll).toHaveBeenCalledWith(dto);
  });

  it('should get blog by id', async () => {
    const blog = { id: 'b1' };
    blogService.findById.mockResolvedValue(blog as never);

    await expect(controller.getById('b1')).resolves.toBe(blog);
    expect(blogService.findById).toHaveBeenCalledWith('b1');
  });

  it('should delete blog by id', async () => {
    blogService.delete.mockResolvedValue(true);

    await expect(controller.deleteById('b1')).resolves.toBe(true);
    expect(blogService.delete).toHaveBeenCalledWith('b1');
  });

  it('should create blog for authenticated user', async () => {
    const dto = new BlogCreateRequestDto();
    const blog = { id: 'b1' };
    blogService.create.mockResolvedValue(blog as never);

    await expect(
      controller.createBlog({ sub: 'u1' } as unknown as ParsedUserDto, dto),
    ).resolves.toBe(blog);
    expect(blogService.create).toHaveBeenCalledWith('u1', dto);
  });

  it('should patch update blog', async () => {
    const blog = { id: 'b1' };
    blogService.update.mockResolvedValue(blog as never);

    await expect(controller.updateById('b1', { title: 'x' })).resolves.toBe(
      blog,
    );
    expect(blogService.update).toHaveBeenCalledWith('b1', { title: 'x' });
  });

  it('should replace blog', async () => {
    const dto = new BlogPutUpdateRequestDto();
    const blog = { id: 'b1' };
    blogService.replace.mockResolvedValue(blog as never);

    await expect(controller.putUpdateById('b1', dto)).resolves.toBe(blog);
    expect(blogService.replace).toHaveBeenCalledWith('b1', dto);
  });
});
