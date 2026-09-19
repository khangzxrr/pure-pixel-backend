import { BadRequestException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { MemoryStoredFile } from 'nestjs-form-data';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { NotificationService } from 'src/notification/services/notification.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { MeDto } from '../dtos/me.dto';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { UserFindAllResponseDto } from '../dtos/rest/user-find-all.response.dto';
import { UserDto } from '../dtos/user.dto';
import { CannotBanAdminException } from '../exceptions/cannot-ban-admin.exception';
import { CannotCreateNewUserException } from '../exceptions/cannot-create-new-user.exception';
import { FailedToUpdateUserException } from '../exceptions/cannot-update-user.exception';
import { PhoneNumberNotValidException } from '../exceptions/phone-number-not-valid.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UserService } from './user.service';

describe('UserService', () => {
  let userRepository: {
    findUniqueOrThrow: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  let bunnyService: { uploadPublic: jest.Mock; pruneCache: jest.Mock };
  let keycloakService: {
    disableUserAndClearSession: jest.Mock;
    enableUser: jest.Mock;
    updateById: jest.Mock;
    create: jest.Mock;
    countUsers: jest.Mock;
    findUsers: jest.Mock;
    upsert: jest.Mock;
    findFirst: jest.Mock;
    getUserRoles: jest.Mock;
    addRoleToUser: jest.Mock;
  };
  let photoRepository: { count: jest.Mock };
  let bookingRepository: { count: jest.Mock };
  let cache: { del: jest.Mock; set: jest.Mock };
  let notificationService: { addNotificationToQueue: jest.Mock };
  let service: UserService;

  const keycloakError = (status: number, errorMessage = 'conflict') => ({
    response: { status },
    responseData: { errorMessage },
  });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    userRepository = {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    };
    bunnyService = { uploadPublic: jest.fn(), pruneCache: jest.fn() };
    keycloakService = {
      disableUserAndClearSession: jest.fn(),
      enableUser: jest.fn(),
      updateById: jest.fn(),
      create: jest.fn(),
      countUsers: jest.fn(),
      findUsers: jest.fn(),
      upsert: jest.fn(),
      findFirst: jest.fn(),
      getUserRoles: jest.fn(),
      addRoleToUser: jest.fn(),
    };
    photoRepository = { count: jest.fn() };
    bookingRepository = { count: jest.fn() };
    cache = { del: jest.fn(), set: jest.fn() };
    notificationService = { addNotificationToQueue: jest.fn() };

    service = new UserService(
      userRepository as unknown as UserRepository,
      bunnyService as unknown as BunnyService,
      keycloakService as unknown as KeycloakService,
      photoRepository as unknown as PhotoRepository,
      bookingRepository as unknown as BookingRepository,
      cache as unknown as Cache,
      notificationService as unknown as NotificationService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('ban', () => {
    it('throws when banning yourself', async () => {
      await expect(service.ban('admin', 'admin')).rejects.toBeInstanceOf(
        CannotBanAdminException,
      );
      expect(keycloakService.disableUserAndClearSession).not.toHaveBeenCalled();
    });

    it('disables the target and queues a ban notification', async () => {
      await service.ban('admin', 'target');

      expect(keycloakService.disableUserAndClearSession).toHaveBeenCalledWith(
        'target',
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'target',
          referenceType: 'BAN',
          type: 'BOTH_INAPP_EMAIL',
          payload: {},
          title: 'Tài khoản của bạn bị cấm',
        }),
      );
    });
  });

  it('unban enables the target', async () => {
    await service.unban('target');

    expect(keycloakService.enableUser).toHaveBeenCalledWith('target');
  });

  describe('updatePhotoQuota', () => {
    it('decrements usage when it stays positive', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        photoQuotaUsage: BigInt(10),
      });

      await service.updatePhotoQuota('u1', 3);

      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledWith('u1');
      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        photoQuotaUsage: { decrement: 3 },
      });
    });

    it('resets usage to zero when the quota covers it', async () => {
      userRepository.findUniqueOrThrow.mockResolvedValue({
        photoQuotaUsage: BigInt(3),
      });

      await service.updatePhotoQuota('u1', 3);

      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        photoQuotaUsage: 0,
      });
    });
  });

  describe('update', () => {
    const updateDto = {
      mail: 'john@mail.com',
      role: Constants.PHOTOGRAPHER_ROLE,
      enabled: true,
      name: 'Võ Khang',
      quote: 'quote',
      location: 'VietNam',
      phonenumber: '0919092211',
      socialLinks: ['s1'],
      expertises: ['e1'],
    };

    it('updates keycloak and the database, clears cache and returns the user', async () => {
      userRepository.update.mockResolvedValue({ id: 'u1' });
      const dto = new UserDto('u1');
      const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(dto);

      await expect(service.update('u1', updateDto)).resolves.toBe(dto);

      expect(keycloakService.updateById).toHaveBeenCalledWith('u1', {
        mail: 'john@mail.com',
        role: Constants.PHOTOGRAPHER_ROLE,
        enabled: true,
      });
      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        mail: 'john@mail.com',
        name: 'Võ Khang',
        normalizedName: 'vo khang',
        quote: 'quote',
        location: 'VietNam',
        phonenumber: '0919092211',
        socialLinks: ['s1'],
        expertises: ['e1'],
      });
      expect(cache.del).toHaveBeenCalledWith('me_u1');
      expect(findOne).toHaveBeenCalledWith({ id: 'u1' });
    });

    it('throws BadRequestException with the keycloak message on conflict', async () => {
      keycloakService.updateById.mockRejectedValue(
        keycloakError(409, 'User exists with same email'),
      );

      const promise = service.update('u1', updateDto);

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toThrow('User exists with same email');
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('throws FailedToUpdateUserException on other keycloak errors', async () => {
      keycloakService.updateById.mockRejectedValue(keycloakError(500));

      await expect(service.update('u1', updateDto)).rejects.toBeInstanceOf(
        FailedToUpdateUserException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      username: 'john',
      name: 'John Đoe',
      mail: 'john@mail.com',
      phonenumber: '0919092211',
      quote: 'quote',
      location: 'HCM',
      socialLinks: ['s'],
      expertises: ['e'],
      role: Constants.CUSTOMER_ROLE,
    };

    it('creates the keycloak user, upserts it to the database and returns it', async () => {
      keycloakService.create.mockResolvedValue({ id: 'kc-id' });
      userRepository.upsert.mockResolvedValue({ id: 'kc-id' });
      const dto = new UserDto('u1');
      const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(dto);

      await expect(service.create(createDto)).resolves.toBe(dto);

      expect(keycloakService.create).toHaveBeenCalledWith({
        role: Constants.CUSTOMER_ROLE,
        mail: 'john@mail.com',
        username: 'john',
      });
      expect(userRepository.upsert).toHaveBeenCalledWith({
        id: 'kc-id',
        mail: 'john@mail.com',
        name: 'John Đoe',
        normalizedName: 'john doe',
        phonenumber: '0919092211',
        cover: Constants.DEFAULT_COVER,
        avatar: Constants.DEFAULT_AVATAR,
        quote: 'quote',
        location: 'HCM',
        socialLinks: ['s'],
        expertises: ['e'],
      });
      expect(findOne).toHaveBeenCalledWith({ id: 'kc-id' });
    });

    it('throws BadRequestException with the keycloak message on conflict', async () => {
      keycloakService.create.mockRejectedValue(
        keycloakError(409, 'User exists with same username'),
      );

      const promise = service.create(createDto);

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toThrow('User exists with same username');
      expect(userRepository.upsert).not.toHaveBeenCalled();
    });

    it('throws CannotCreateNewUserException on other errors', async () => {
      keycloakService.create.mockRejectedValue(keycloakError(503));

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        CannotCreateNewUserException,
      );
    });
  });

  describe('syncKeycloakWithDatabase', () => {
    it('upserts keycloak users page by page when keycloak has more users', async () => {
      keycloakService.countUsers.mockResolvedValue(3);
      userRepository.count.mockResolvedValue(1);
      keycloakService.findUsers
        .mockResolvedValueOnce([
          { id: 'k1', username: 'Alice', email: 'alice@mail.com' },
          { id: 'k2', username: 'Bob', email: 'bob@mail.com' },
        ])
        .mockResolvedValueOnce([]);
      userRepository.upsert.mockResolvedValue({});

      await service.syncKeycloakWithDatabase();

      expect(userRepository.count).toHaveBeenCalledWith({});
      expect(keycloakService.findUsers).toHaveBeenNthCalledWith(1, 0, -1);
      expect(keycloakService.findUsers).toHaveBeenNthCalledWith(2, 2, -1);
      expect(keycloakService.findUsers).toHaveBeenCalledTimes(2);
      expect(userRepository.upsert).toHaveBeenCalledWith({
        id: 'k1',
        mail: 'alice@mail.com',
        name: 'Alice',
        cover: Constants.DEFAULT_COVER,
        avatar: Constants.DEFAULT_AVATAR,
        normalizedName: 'alice',
        location: 'TP.Hồ Chí Minh',
      });
      expect(userRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'k2', name: 'Bob' }),
      );
      expect(userRepository.findMany).not.toHaveBeenCalled();
    });

    it('pushes database users to keycloak otherwise and keeps going on failures', async () => {
      keycloakService.countUsers.mockResolvedValue(1);
      userRepository.count.mockResolvedValue(2);
      userRepository.findMany.mockResolvedValue([
        { id: 'u1', mail: 'a@mail.com' },
        { id: 'u2', mail: 'b@mail.com' },
      ]);
      keycloakService.upsert
        .mockRejectedValueOnce(new Error('conflict'))
        .mockResolvedValueOnce({ id: 'k2' });

      await expect(service.syncKeycloakWithDatabase()).resolves.toBeUndefined();

      expect(userRepository.findMany).toHaveBeenCalledWith({}, [], {});
      expect(keycloakService.upsert).toHaveBeenCalledTimes(2);
      expect(keycloakService.upsert).toHaveBeenNthCalledWith(
        2,
        'b@mail.com',
        'b@mail.com',
        Constants.CUSTOMER_ROLE,
      );
      expect(keycloakService.findUsers).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const existingUser = () => ({
      id: 'u1',
      name: 'Old Name',
      avatar: 'old-avatar',
      cover: 'old-cover',
    });

    beforeEach(() => {
      userRepository.findUniqueOrThrow.mockResolvedValue(existingUser());
      userRepository.update.mockImplementation((_id, data) =>
        Promise.resolve({ id: 'u1', ...data, name: data.name ?? 'Old Name' }),
      );
    });

    it('throws for an invalid phone number', async () => {
      await expect(
        service.updateProfile('u1', { phonenumber: '12345' }),
      ).rejects.toBeInstanceOf(PhoneNumberNotValidException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('uploads avatar and cover and updates every given field', async () => {
      jest.useFakeTimers({ now: new Date('2024-05-06T00:00:00.000Z') });
      const updatedAt = new Date('2024-05-06T00:00:00.000Z').getTime();
      const avatar = { extension: 'png' } as MemoryStoredFile;
      const cover = { extension: 'jpg' } as MemoryStoredFile;
      bunnyService.uploadPublic
        .mockResolvedValueOnce('https://cdn/avatar/u1.png')
        .mockResolvedValueOnce('https://cdn/cover/u1.jpg');

      const result = await service.updateProfile('u1', {
        phonenumber: '0912345678',
        avatar,
        cover,
        name: 'Nguyễn Văn A',
        quote: 'q',
        location: 'HN',
        mail: 'a@mail.com',
        socialLinks: ['fb'],
        expertises: ['wedding'],
      });

      expect(userRepository.findUniqueOrThrow).toHaveBeenCalledWith('u1', {});
      expect(bunnyService.uploadPublic).toHaveBeenNthCalledWith(
        1,
        avatar,
        'avatar/u1.png',
      );
      expect(bunnyService.uploadPublic).toHaveBeenNthCalledWith(
        2,
        cover,
        'cover/u1.jpg',
      );
      const avatarUrl = `https://cdn/avatar/u1.png?updatedAt=${updatedAt}`;
      const coverUrl = `https://cdn/cover/u1.jpg?updatedAt=${updatedAt}`;
      expect(bunnyService.pruneCache).toHaveBeenCalledWith(avatarUrl);
      expect(bunnyService.pruneCache).toHaveBeenCalledWith(coverUrl);
      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        avatar: avatarUrl,
        cover: coverUrl,
        name: 'Nguyễn Văn A',
        normalizedName: 'nguyen van a',
        quote: 'q',
        location: 'HN',
        mail: 'a@mail.com',
        phonenumber: '0912345678',
        socialLinks: { set: ['fb'] },
        expertises: { set: ['wedding'] },
      });
      expect(cache.del).toHaveBeenCalledWith('me_u1');
      expect(result).toBeInstanceOf(UserDto);
      expect(result.name).toBe('Nguyễn Văn A');
    });

    it('keeps existing images and normalizes the current name when fields are absent', async () => {
      const result = await service.updateProfile('u1', { phonenumber: '' });

      expect(bunnyService.uploadPublic).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('u1', {
        avatar: 'old-avatar',
        cover: 'old-cover',
        name: undefined,
        normalizedName: 'old name',
        quote: undefined,
        location: undefined,
        mail: undefined,
        phonenumber: '',
        socialLinks: undefined,
        expertises: undefined,
      });
      expect(result).toBeInstanceOf(UserDto);
    });
  });

  describe('findMany', () => {
    const findAllDto = () =>
      Object.assign(new UserFindAllRequestDto(), {
        limit: 10,
        page: 0,
        search: 'jo',
      });

    it('merges keycloak info and roles into each user', async () => {
      const dto = findAllDto();
      userRepository.count.mockResolvedValue(12);
      userRepository.findMany.mockResolvedValue([
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ]);
      keycloakService.findFirst.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'u1' ? { enabled: false, username: 'alice' } : {},
        ),
      );
      keycloakService.getUserRoles.mockImplementation((id: string) => {
        if (id === 'u1') {
          return Promise.resolve([
            { name: 'photographer' },
            { id: 'nameless' },
          ]);
        }

        //u2 gets the default role once addRoleToUser was called
        return Promise.resolve(
          keycloakService.addRoleToUser.mock.calls.length > 0
            ? [{ name: Constants.CUSTOMER_ROLE }]
            : [],
        );
      });

      const result = await service.findMany(dto);

      expect(userRepository.count).toHaveBeenCalledWith(dto.toWhere());
      expect(userRepository.findMany).toHaveBeenCalledWith(
        dto.toWhere(),
        dto.toOrderBy(),
        {},
        0,
        10,
      );
      expect(result).toBeInstanceOf(UserFindAllResponseDto);
      expect(result.totalRecord).toBe(12);
      expect(result.totalPage).toBe(2);

      const [alice, bob] = result.objects;
      expect(alice).toBeInstanceOf(UserDto);
      expect(alice.id).toBe('u1');
      expect(alice.enabled).toBe(false);
      expect(alice.username).toBe('alice');
      expect(alice.roles).toEqual(['photographer']);

      expect(bob.id).toBe('u2');
      expect(bob.enabled).toBeUndefined();
      expect(bob.username).toBeUndefined();
      expect(keycloakService.addRoleToUser).toHaveBeenCalledWith(
        'u2',
        Constants.CUSTOMER_ROLE,
      );
      expect(bob.roles).toEqual([Constants.CUSTOMER_ROLE]);
    });

    it('does not load roles for users missing in keycloak or failing to load', async () => {
      userRepository.count.mockResolvedValue(3);
      userRepository.findMany.mockResolvedValue([
        { id: 'ok' },
        { id: 'missing' },
        { id: 'broken' },
      ]);
      keycloakService.findFirst.mockImplementation((id: string) => {
        if (id === 'broken') {
          return Promise.reject(new Error('keycloak down'));
        }
        return Promise.resolve(id === 'ok' ? { enabled: true } : undefined);
      });
      keycloakService.getUserRoles.mockResolvedValue([{ name: 'customer' }]);

      const result = await service.findMany(findAllDto());

      expect(result.totalRecord).toBe(3);
      expect(result.objects).toContainEqual(
        expect.objectContaining({
          id: 'ok',
          enabled: true,
          roles: ['customer'],
        }),
      );
      expect(keycloakService.getUserRoles).toHaveBeenCalledTimes(1);
      expect(keycloakService.getUserRoles).toHaveBeenCalledWith('ok');
    });
  });

  describe('findMe', () => {
    it('throws when the user does not exist', async () => {
      userRepository.findUnique.mockResolvedValue(null);

      await expect(service.findMe('u1')).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
    });

    it('returns the user with photo and booking counters and caches it', async () => {
      userRepository.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'John',
        _count: { photos: 3, bookings: 2 },
      });
      photoRepository.count.mockResolvedValue(4);
      bookingRepository.count.mockResolvedValue(5);

      const me = await service.findMe('u1');

      expect(userRepository.findUnique).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          _count: expect.objectContaining({
            select: expect.objectContaining({
              photos: { where: { photoType: 'RAW', deletedAt: null } },
            }),
          }),
        }),
      );
      expect(photoRepository.count).toHaveBeenCalledWith({
        photographerId: 'u1',
        photoSellings: { some: { active: true } },
        deletedAt: null,
      });
      expect(bookingRepository.count).toHaveBeenCalledWith({
        originalPhotoshootPackage: { userId: 'u1' },
      });
      expect(me).toBeInstanceOf(MeDto);
      expect(me.sellingPhotoCount).toBe(4);
      expect(me.normalPhotoCount).toBe(3);
      expect(me.totalPhotoCount).toBe(7);
      expect(me.myBookingCount).toBe(2);
      expect(me.otherBookingCount).toBe(5);
      expect(cache.set).toHaveBeenCalledWith('me_u1', me);
    });
  });

  describe('findOne', () => {
    const dbUser = {
      id: 'u1',
      name: 'John',
      normalizedName: 'john',
      mail: 'john@mail.com',
      ftpUsername: 'ftp-user',
    };

    it('throws when the user does not exist', async () => {
      userRepository.findUnique.mockResolvedValue(null);

      await expect(service.findOne({ id: 'u1' })).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
      expect(keycloakService.findFirst).not.toHaveBeenCalled();
    });

    it('creates the keycloak user as customer when it is missing', async () => {
      userRepository.findUnique.mockResolvedValue(dbUser);
      keycloakService.findFirst.mockResolvedValue(undefined);

      const result = await service.findOne({ id: 'u1' });

      expect(keycloakService.upsert).toHaveBeenCalledWith(
        'john',
        'john@mail.com',
        Constants.CUSTOMER_ROLE,
        'u1',
      );
      expect(result).toBeInstanceOf(UserDto);
      expect(result.id).toBe('u1');
      expect(result.ftpUsername).toBe('ftp-user');
      expect(result.enabled).toBe(true);
      expect(result.roles).toEqual([Constants.CUSTOMER_ROLE]);
      expect(keycloakService.getUserRoles).not.toHaveBeenCalled();
    });

    it('returns keycloak enabled state and role names', async () => {
      userRepository.findUnique.mockResolvedValue(dbUser);
      keycloakService.findFirst.mockResolvedValue({ enabled: false });
      keycloakService.getUserRoles.mockResolvedValue([
        { name: 'manager' },
        { id: 'nameless' },
      ]);

      const result = await service.findOne({ id: 'u1' });

      expect(keycloakService.findFirst).toHaveBeenCalledWith('u1');
      expect(keycloakService.addRoleToUser).not.toHaveBeenCalled();
      expect(result.enabled).toBe(false);
      expect(result.roles).toEqual(['manager']);
    });

    it('adds the customer role when the user has no role', async () => {
      userRepository.findUnique.mockResolvedValue(dbUser);
      keycloakService.findFirst.mockResolvedValue({});
      keycloakService.getUserRoles.mockResolvedValue([]);

      const result = await service.findOne({ id: 'u1' });

      expect(keycloakService.addRoleToUser).toHaveBeenCalledWith(
        'u1',
        Constants.CUSTOMER_ROLE,
      );
      expect(result.enabled).toBeUndefined();
    });
  });
});
