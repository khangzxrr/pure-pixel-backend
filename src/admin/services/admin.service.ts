import { Inject, Injectable } from '@nestjs/common';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { StorageService } from 'src/storage/services/storage.service';

import * as fs from 'fs';
import * as path from 'path';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoUploadRequestDto } from 'src/photo/dtos/rest/photo-upload.request';
import { MemoryStoredFile } from 'nestjs-form-data';

@Injectable()
export class AdminService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly storageService: StorageService,
    @Inject() private readonly photoService: PhotoService,
  ) {}

  readRandomUsernames() {
    const usernames = fs
      .readFileSync(
        path.join(process.cwd(), './prisma/random_username.csv'),
        'utf-8',
      )
      .split('\n');

    return usernames;
  }

  readImageList() {
    const files = fs.readdirSync(path.join(process.cwd(), `./images`));

    return files;
  }

  readFileToBuffer(filepath: string) {
    const file = fs.readFileSync(path.join(process.cwd(), filepath));

    return file;
  }

  async seed() {
    const usernames = this.readRandomUsernames();

    const imageList = this.readImageList();

    const imagePerUserCount = Math.floor(imageList.length / usernames.length);

    usernames.forEach(async (username) => {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length === 0) {
        return;
      }

      const keycloakUser = await this.keycloakService.createUser(
        trimmedUsername,
        'photographer',
      );
      const user = await this.userRepository.createIfNotExist({
        id: keycloakUser.id,
        mail: `${trimmedUsername}@gmail.com`,
        name: trimmedUsername,
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

      for (let i = 0; i < imagePerUserCount; i++) {
        const photoUploadDto = new PhotoUploadRequestDto();
        photoUploadDto.file = new MemoryStoredFile();

        imageList.shift();

        photoUploadDto.file.buffer = this.readFileToBuffer(
          `./images/${imageList[0]}`,
        );
        photoUploadDto.file.size = photoUploadDto.file.buffer.byteLength;
        photoUploadDto.file.originalName = imageList[0];

        try {
          const photoDto = await this.photoService.uploadPhoto(
            user.id,
            photoUploadDto,
          );

          await this.photoService.updatePhoto(user.id, photoDto.id, {
            visibility: 'PUBLIC',
          });
        } catch (e) {
          console.log(e);
        }
      }

      console.log(
        `finished user ${username} remain: ${usernames.indexOf(username) + 1 - usernames.length} users`,
      );
    });
  }
}
