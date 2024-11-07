import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UserDto } from '../dtos/user.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';

import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { plainToInstance } from 'class-transformer';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { MeDto } from '../dtos/me.dto';
import { BunnyService } from 'src/storage/services/bunny.service';
import { UserFindAllRequestDto } from '../dtos/rest/user-find-all.request.dto';
import { CreateUserDto } from '../dtos/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject() private readonly keycloakService: KeycloakService,
  ) {}

  async create(createDto: CreateUserDto) {
    const createdKeycloakUser = await this.keycloakService.createUser(
      createDto.username,
      createDto.mail,
      createDto.firstname,
      createDto.lastname,
      createDto.role,
    );
  }

  async syncKeycloakWithDatabase() {
    let skip = 0;

    const keycloakUserCount = await this.keycloakService.countUsers();
    const applicationUserCount = await this.userRepository.count({});

    if (keycloakUserCount < applicationUserCount) {
      while (true) {
        const keycloakUsers = await this.keycloakService.findUsers(skip, -1);

        keycloakUsers.forEach(async (ku) => {
          await this.userRepository.upsert({
            id: ku.id,
            mail: ku.email,
            name: ku.username,
            cover: Constants.DEFAULT_COVER,
            quote: '',
            avatar: Constants.DEFAULT_AVATAR,
            normalizedName: ku.username,
            location: 'TP.Hồ Chí Minh',
            phonenumber: '',
            expertises: [''],
            ftpPassword: '',
            ftpUsername: '',
            socialLinks: [''],
            packageCount: BigInt('0'),
            maxPhotoQuota: BigInt('0'),
            maxPackageCount: BigInt('0'),
            photoQuotaUsage: BigInt('0'),
            createdAt: new Date(),
            updatedAt: new Date(),
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

    const users = await this.userRepository.findMany(
      {},
      [],
      0,
      Number.MAX_VALUE,
    );

    users.forEach(async (u) => {
      const keycloakUser = await this.keycloakService.createUser(
        u.name,
        u.mail,
        '',
        '',
        Constants.CUSTOMER_ROLE,
      );

      console.log(`insert ${keycloakUser.id} to keycloak database`);
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findUniqueOrThrow(userId, {});

    if (updateProfileDto.avatar) {
      //temporary use user.avatar
      user.avatar = await this.bunnyService.uploadPublic(
        updateProfileDto.avatar,
        `avatar/${userId}.${updateProfileDto.avatar.extension}`,
      );
    }

    if (updateProfileDto.cover) {
      //temporary use user.cover
      user.cover = await this.bunnyService.uploadPublic(
        updateProfileDto.cover,
        `cover/${userId}.${updateProfileDto.cover.extension}`,
      );
    }

    const updatedUser = await this.userRepository.update(userId, {
      avatar: user.avatar,
      cover: user.cover,
      name: updateProfileDto.name,
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

    return plainToInstance(UserDto, updatedUser);
  }

  async findMany(findAllDto: UserFindAllRequestDto) {
    const users = await this.userRepository.findMany(
      {},
      [],
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    const userDtoPromises = users.map(async (u) => {
      const dto = plainToInstance(UserDto, u);

      try {
        const roles = await this.keycloakService.getUserRoles(u.id);
        dto.roles = roles.map((r) => r.name);
      } catch (e) {
        console.log(e);
      }

      return dto;
    });

    const userDtos = await Promise.all(userDtoPromises);

    return userDtos;
  }

  async findOne(userFilterDto: UserFilterDto) {
    const role = await this.keycloakService.getUserRoles(userFilterDto.id);

    console.log(role);

    const user = await this.userRepository.findUnique(userFilterDto.id, {
      _count: {
        select: {
          photos: true,
          cameras: true,
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

    const meDto = plainToInstance(MeDto, user);

    return meDto;
  }
}
