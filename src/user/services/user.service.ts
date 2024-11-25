import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UserDto } from '../dtos/user.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';

import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { plainToInstance } from 'class-transformer';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';

import { BunnyService } from 'src/storage/services/bunny.service';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CannotCreateNewUserException } from '../exceptions/cannot-create-new-user.exception';
import { Utils } from 'src/infrastructure/utils/utils';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { FailedToUpdateUserException } from '../exceptions/cannot-update-user.exception';
import { UserFindAllResponseDto } from '../dtos/rest/user-find-all.response.dto';
import { MeDto } from '../dtos/me.dto';
import { UserInReport } from 'src/database/types/user';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject() private readonly keycloakService: KeycloakService,

    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async update(id: string, updateDto: UpdateUserDto) {
    try {
      await this.keycloakService.updateById(id, {
        mail: updateDto.mail,
        role: updateDto.role,
        enabled: updateDto.enabled,
      });

      const updatedUser = await this.userRepository.update(id, {
        mail: updateDto.mail,
        name: updateDto.name,
        quote: updateDto.quote,
        location: updateDto.location,
        phonenumber: updateDto.phonenumber,
        socialLinks: updateDto.socialLinks,
        expertises: updateDto.expertises,
      });

      await this.cache.del(`me_${id}`);

      return await this.findOne({ id: updatedUser.id });
    } catch (e) {
      if (e.response.status === 409) {
        throw new BadRequestException(e.responseData.errorMessage);
      }

      console.log(e);
      throw new FailedToUpdateUserException();
    }
  }

  async create(createDto: CreateUserDto) {
    try {
      const createdKeycloakUser = await this.keycloakService.create({
        role: createDto.role,
        mail: createDto.mail,
        username: createDto.username,
      });

      const user = await this.userRepository.upsert({
        id: createdKeycloakUser.id,
        mail: createDto.mail,
        name: createDto.name,
        normalizedName: Utils.normalizeText(createDto.name),
        phonenumber: createDto.phonenumber,
        cover: Constants.DEFAULT_COVER,
        avatar: Constants.DEFAULT_AVATAR,
        quote: createDto.quote,
        location: createDto.location,
        socialLinks: createDto.socialLinks,
        expertises: createDto.expertises,
      });

      return await this.findOne({
        id: user.id,
      });
    } catch (e) {
      if (e.response.status === 409) {
        throw new BadRequestException(e.responseData.errorMessage);
      }

      console.log(e);
      throw new CannotCreateNewUserException();
    }
  }

  async syncKeycloakWithDatabase() {
    let skip = 0;

    const keycloakUserCount = await this.keycloakService.countUsers();
    const applicationUserCount = await this.userRepository.count({});

    if (keycloakUserCount > applicationUserCount) {
      while (true) {
        const keycloakUsers = await this.keycloakService.findUsers(skip, -1);

        keycloakUsers.forEach(async (ku) => {
          await this.userRepository.upsert({
            id: ku.id,
            mail: ku.email,
            name: ku.username,
            cover: Constants.DEFAULT_COVER,
            avatar: Constants.DEFAULT_AVATAR,
            normalizedName: Utils.normalizeText(ku.username),
            location: 'TP.Hồ Chí Minh',
          });

          console.log(`insert ${ku.username} to database`);
        });

        if (keycloakUsers.length === 0) {
          break;
        }

        skip += keycloakUsers.length;
      }

      return;
    }

    const users = await this.userRepository.findMany({}, [], {});
    for (const user of users) {
      try {
        console.log(`inserting ${user.id} to keycloak database..`);
        const keycloakUser = await this.keycloakService.upsert(
          user.mail,
          user.mail,
          Constants.CUSTOMER_ROLE,
        );

        console.log(`inserted ${keycloakUser.id} to keycloak database`);
      } catch (e) {
        console.log(e);
      }
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findUniqueOrThrow(userId, {});

    if (updateProfileDto.avatar) {
      //temporary use user.avatar
      user.avatar = await this.bunnyService.uploadPublic(
        updateProfileDto.avatar,
        `avatar/${userId}.${updateProfileDto.avatar.extension}`,
      );

      await this.bunnyService.pruneCache(user.avatar);
    }

    if (updateProfileDto.cover) {
      //temporary use user.cover
      user.cover = await this.bunnyService.uploadPublic(
        updateProfileDto.cover,
        `cover/${userId}.${updateProfileDto.cover.extension}`,
      );

      await this.bunnyService.pruneCache(user.avatar);
    }

    const normalizedName = updateProfileDto.name
      ? Utils.normalizeText(updateProfileDto.name)
      : Utils.normalizeText(user.name);

    const updatedUser = await this.userRepository.update(userId, {
      avatar: user.avatar,
      cover: user.cover,
      name: updateProfileDto.name,
      normalizedName,
      quote: updateProfileDto.quote,
      location: updateProfileDto.location,
      mail: updateProfileDto.mail,
      phonenumber: updateProfileDto.phonenumber,
      socialLinks: updateProfileDto.socialLinks
        ? {
            set: updateProfileDto.socialLinks,
          }
        : undefined,
      expertises: updateProfileDto.expertises
        ? {
            set: updateProfileDto.expertises,
          }
        : undefined,
    });

    await this.cache.del(`me_${userId}`);

    return plainToInstance(UserDto, updatedUser);
  }

  async findMany(findAllDto: UserFindAllRequestDto) {
    const where: Prisma.UserWhereInput = {};

    const count = await this.userRepository.count(where);

    const users: UserInReport[] = await this.userRepository.findMany(
      {},
      [],
      {},
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    const userDtoPromises = users.map(async (u) => {
      const dto = plainToInstance(UserDto, u);

      return dto;

      // try {
      //   const kcUser = await this.keycloakService.findFirst(u.id);
      //
      //   if (kcUser === null) {
      //     return null;
      //   }
      //
      //   dto.enabled = kcUser.enabled;
      //   dto.username = kcUser.username;
      //
      //   const roles = await this.keycloakService.getUserRoles(u.id);
      //   dto.roles = roles.map((r) => r.name);
      //
      //   return dto;
      // } catch (e) {
      //   return null;
      // }
    });

    const userDtos = await Promise.all(userDtoPromises);

    return new UserFindAllResponseDto(findAllDto.limit, count, userDtos);
  }

  async findMe(userId: string) {
    // const cachedDto = await this.cache.get<MeDto>(`me_${userId}`);
    //
    // if (cachedDto) {
    //   return cachedDto;
    // }

    const keycloakUser = await this.keycloakService.findFirst(userId);

    const roles = await this.keycloakService.getUserRoles(keycloakUser.id);

    const user = await this.userRepository.findUnique(userId, {
      _count: {
        select: {
          photos: {
            where: {
              deletedAt: null,
            },
          },
          cameraOnUsers: true,
          bookings: true,
          comments: true,
          followers: true,
          followings: true,
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const meDto = plainToInstance(MeDto, user, {});

    meDto.enabled = keycloakUser.enabled;
    meDto.roles = roles.map((r) => r.name);

    await this.cache.set(`me_${userId}`, meDto);

    return meDto;
  }

  async findOne(userFilterDto: UserFilterDto) {
    const keycloakUser = await this.keycloakService.findFirst(userFilterDto.id);

    const roles = await this.keycloakService.getUserRoles(keycloakUser.id);

    const user = await this.userRepository.findUnique(userFilterDto.id, {
      _count: {
        select: {
          photos: {
            where: {
              deletedAt: null,
            },
          },
          cameraOnUsers: true,
          bookings: true,
          comments: true,
          followers: true,
          followings: true,
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const userDto = plainToInstance(UserDto, user, {
      groups: [Constants.PHOTOGRAPHER_ROLE],
    });

    userDto.enabled = keycloakUser.enabled;
    userDto.roles = roles.map((r) => r.name);

    return userDto;
  }
}
