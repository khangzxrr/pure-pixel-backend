import { CreateUserDto } from '../dtos/create-user.dto';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserService } from '../services/user.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let userService: {
    findOne: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    ban: jest.Mock;
    unban: jest.Mock;
  };
  let controller: UserController;

  beforeEach(() => {
    userService = {
      findOne: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      ban: jest.fn(),
      unban: jest.fn(),
    };
    controller = new UserController(userService as unknown as UserService);
  });

  it('getUserById finds the user by id', async () => {
    userService.findOne.mockResolvedValue({ id: 'u1' });

    await expect(controller.getUserById('u1')).resolves.toEqual({ id: 'u1' });
    expect(userService.findOne).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('getAllUsers finds users with the filter', async () => {
    const dto = new UserFindAllRequestDto();
    userService.findMany.mockResolvedValue({ objects: [] });

    await expect(controller.getAllUsers(dto)).resolves.toEqual({ objects: [] });
    expect(userService.findMany).toHaveBeenCalledWith(dto);
  });

  it('createNewUser creates the user', async () => {
    const dto = { username: 'john' } as CreateUserDto;
    userService.create.mockResolvedValue({ id: 'u1' });

    await expect(controller.createNewUser(dto)).resolves.toEqual({ id: 'u1' });
    expect(userService.create).toHaveBeenCalledWith(dto);
  });

  it('patchUpdateUsers updates the user', async () => {
    const dto: UpdateUserDto = { name: 'John' };
    userService.update.mockResolvedValue({ id: 'u1' });

    await expect(controller.patchUpdateUsers('u1', dto)).resolves.toEqual({
      id: 'u1',
    });
    expect(userService.update).toHaveBeenCalledWith('u1', dto);
  });

  it('banUser bans the target on behalf of the logged user', async () => {
    userService.ban.mockResolvedValue(undefined);

    await controller.banUser({ sub: 'admin' }, 'target');

    expect(userService.ban).toHaveBeenCalledWith('admin', 'target');
  });

  it('unbanUser unbans the target', async () => {
    userService.unban.mockResolvedValue(undefined);

    await controller.unbanUser('target');

    expect(userService.unban).toHaveBeenCalledWith('target');
  });
});
