import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UserDto } from '../dtos/user.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { StorageService } from 'src/storage/services/storage.service';

import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { plainToInstance } from 'class-transformer';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { MeDto } from '../dtos/me.dto';
import { BunnyService } from 'src/storage/services/bunny.service';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject() private readonly keycloakService: KeycloakService,
  ) {}

  async syncKeycloakWithDatabase() {
    let skip = 0;

    while (true) {
      const keycloakUsers = await this.keycloakService.findUsers(skip, 10);

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

      skip += 10;
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    console.log(updateProfileDto);

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

  async findOne(userFilterDto: UserFilterDto) {
    const user = await this.userRepository.findUnique(userFilterDto.id, {});

    if (!user) {
      throw new UserNotFoundException();
    }

    return plainToInstance(MeDto, user);
  }
}
