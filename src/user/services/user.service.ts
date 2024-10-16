import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UserDto } from '../dtos/me.dto';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { Constants } from 'src/infrastructure/utils/constants';
import { StorageService } from 'src/storage/services/storage.service';
import { PresignedUploadMediaDto } from '../dtos/presigned-upload-media.dto';
import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly storageService: StorageService,
  ) {}

  async generatePresignedUploadMedia(userId: string) {
    const user = await this.userRepository.findOneById(userId);

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
    const user = await this.userRepository.findOneById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const isPhotographer = await this.keycloakService.isUserHasRole(
      userId,
      Constants.PHOTOGRAPHER_ROLE,
    );

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateProfileDto,
    );

    const meDto = new UserDto(
      updatedUser,
      isPhotographer ? Constants.PHOTOGRAPHER_ROLE : Constants.CUSTOMER_ROLE,
    );

    return meDto;
  }

  async findOne(userFilterDto: UserFilterDto) {
    const user = await this.userRepository.findOneWithCount(userFilterDto.id);

    if (!user) {
      throw new UserNotFoundException();
    }
    const isPhotographer = await this.keycloakService.isUserHasRole(
      user.id,
      Constants.PHOTOGRAPHER_ROLE,
    );

    const meDto = new UserDto(
      user,
      isPhotographer ? Constants.PHOTOGRAPHER_ROLE : Constants.CUSTOMER_ROLE,
    );

    return meDto;
  }
}
