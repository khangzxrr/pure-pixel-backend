import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { NewsfeedCreateDto } from '../dtos/newsfeed.create.dto';
import { NewsfeedFindAllDto } from '../dtos/rest/newsfeed-find-all.dto';
import { NewsfeedService } from '../services/newsfeed.service';
import { NewsfeedController } from './newsfeed.controller';

describe('NewsfeedController', () => {
  let newsfeedService: jest.Mocked<
    Pick<NewsfeedService, 'findAll' | 'create' | 'update'>
  >;
  let controller: NewsfeedController;

  const user = { sub: 'u1' } as unknown as ParsedUserDto;
  const findAllDto = Object.assign(new NewsfeedFindAllDto(), {
    limit: 1,
    page: 0,
  });

  beforeEach(() => {
    newsfeedService = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    controller = new NewsfeedController(
      newsfeedService as unknown as NewsfeedService,
    );
  });

  it('should find all newsfeeds for authenticated user', async () => {
    const response = { objects: [] };
    newsfeedService.findAll.mockResolvedValue(response as never);

    await expect(controller.findAll(user, findAllDto)).resolves.toBe(response);
    expect(newsfeedService.findAll).toHaveBeenCalledWith('u1', findAllDto);
  });

  it('should find all newsfeeds for anonymous user', async () => {
    newsfeedService.findAll.mockResolvedValue({ objects: [] } as never);

    await controller.findAll(undefined as unknown as ParsedUserDto, findAllDto);

    expect(newsfeedService.findAll).toHaveBeenCalledWith('', findAllDto);
  });

  it('should create newsfeed', async () => {
    const dto = new NewsfeedCreateDto();
    const created = { id: 'n1' };
    newsfeedService.create.mockResolvedValue(created as never);

    await expect(controller.createNewsfeed(user, dto)).resolves.toBe(created);
    expect(newsfeedService.create).toHaveBeenCalledWith('u1', dto);
  });

  it('should update newsfeed', async () => {
    const updated = { id: 'n1' };
    newsfeedService.update.mockResolvedValue(updated as never);

    await expect(
      controller.updateNewsfeed(user, 'n1', { title: 't' }),
    ).resolves.toBe(updated);
    expect(newsfeedService.update).toHaveBeenCalledWith('u1', 'n1', {
      title: 't',
    });
  });
});
