import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UserDto } from '../dtos/user.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { StorageService } from 'src/storage/services/storage.service';
import { PresignedUploadMediaDto } from '../dtos/presigned-upload-media.dto';
import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { plainToInstance } from 'class-transformer';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { MeDto } from '../dtos/me.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly storageService: StorageService,
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

  async generatePresignedUploadMedia(userId: string) {
    const user = await this.userRepository.findUnique(userId, {});

    if (!user) {
      throw new UserNotFoundException();
    }

    const avatarKey = `avatar/${user.id}.jpg`;
    const coverKey = `cover/${user.id}.jpg`;

    const presignedUploadAvatar =
      await this.storageService.getPresignedUploadUrl(avatarKey);
    const presignedUploadCover =
      await this.storageService.getPresignedUploadUrl(coverKey);

    return new PresignedUploadMediaDto(
      avatarKey,
      coverKey,
      presignedUploadAvatar,
      presignedUploadCover,
    );
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findUnique(userId, {});

    if (!user) {
      throw new UserNotFoundException();
    }

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateProfileDto,
    );

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
