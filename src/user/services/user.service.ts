import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UserDto } from '../dtos/me.dto';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { StorageService } from 'src/storage/services/storage.service';
import { PresignedUploadMediaDto } from '../dtos/presigned-upload-media.dto';
import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { plainToInstance } from 'class-transformer';
import * as fs from 'fs';
import * as path from 'path';
import { Constants } from 'src/infrastructure/utils/constants';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly storageService: StorageService,
  ) {}

  async seed() {
    const usernames = fs
      .readFileSync(
        path.join(process.cwd(), './prisma/random_username.csv'),
        'utf-8',
      )
      .split('\n');

    usernames.forEach(async (username) => {
      const keycloakUser = await this.keycloakService.createUser(
        username.trim(),
        'photographer',
      );
      await this.userRepository.createIfNotExist({
        id: keycloakUser.id,
        mail: `${username}@gmail.com`,
        name: username,
        cover: Constants.DEFAULT_COVER,
        quote: '',
        avatar: Constants.DEFAULT_AVATAR,
        location: 'TP.Hồ Chí Minh',
        phonenumber: '',
        expertises: ['phong cảnh'],
        ftpPassword: '',
        ftpUsername: '',
        socialLinks: [''],
        packageCount: BigInt('999'),
        maxPhotoQuota: BigInt('999999999'),
        maxPackageCount: BigInt('99999'),
        photoQuotaUsage: BigInt('0'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`created photographer ${username}`);
    });
  }

  async generatePresignedUploadMedia(userId: string) {
    const user = await this.userRepository.findUnique(userId);

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
    const user = await this.userRepository.findUnique(userId);

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
    const user = await this.userRepository.findOneWithCount(userFilterDto.id);

    if (!user) {
      throw new UserNotFoundException();
    }

    return plainToInstance(UserDto, user);
  }
}
